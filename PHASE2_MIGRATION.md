# Phase-2: ASP.NET Core Migration Guide

## 📋 Overview

**Purpose:** Migrate ERP Ticketing System from FastAPI + MongoDB to ASP.NET Core + SQL Server

**Current Stack (Phase-1):**
- Backend: FastAPI (Python)
- Database: MongoDB
- Frontend: React + Tailwind CSS

**Target Stack (Phase-2):**
- Backend: ASP.NET Core 8.0 (C#)
- Database: SQL Server 2022
- Frontend: React + Tailwind CSS (unchanged)

**Migration Strategy:** Clean rebuild with architectural reference from Phase-1

---

## 🎯 Migration Objectives

### Primary Goals
1. ✅ Maintain 100% functional parity with Phase-1
2. ✅ Preserve all business logic
3. ✅ Keep React frontend (only change API endpoints)
4. ✅ SQL Server with proper normalization
5. ✅ ERP-compatible architecture (ADO.NET or EF Core)
6. ✅ Enterprise security standards

### Success Criteria
- All 24 ticket fields supported
- Ticket numbering logic identical (YYYY-00001)
- Auto-assignment works with same module mappings
- Email-to-ticket functional
- Dashboard analytics accurate
- Role-based auth matches Phase-1

---

## 🗄️ SQL Server Schema

### Database: ERPTicketing

### Table 1: Tickets
```sql
CREATE TABLE Tickets (
    TicketId INT PRIMARY KEY IDENTITY(1,1),
    TicketNumber NVARCHAR(20) NOT NULL UNIQUE,
    
    -- Customer & Classification
    Customer NVARCHAR(200) NOT NULL,
    CRType NVARCHAR(50) NOT NULL,
    IssueType NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NULL,
    Module NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    
    -- Dates & Times
    CRDate DATE NOT NULL DEFAULT GETDATE(),
    CRTime TIME NOT NULL DEFAULT CONVERT(TIME, GETDATE()),
    PlannedDate DATE NULL,
    CommitmentDate DATE NULL,
    CompletedOn DATE NULL,
    CompletedTime TIME NULL,
    
    -- Financial
    AMCCost NVARCHAR(50) NULL,
    PRApproval NVARCHAR(50) NULL,
    
    -- Priority & Status
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
    Status NVARCHAR(50) NOT NULL DEFAULT 'New',
    
    -- Assignment
    SEName NVARCHAR(100) NULL,
    Developer NVARCHAR(100) NULL,
    DeveloperEmail NVARCHAR(200) NULL,
    
    -- Completion Details
    CompletedBy NVARCHAR(100) NULL,
    TimeDuration NVARCHAR(50) NULL,
    
    -- Additional Fields
    EXESent NVARCHAR(100) NULL,
    ReasonForIssue NVARCHAR(MAX) NULL,
    CustomerCall NVARCHAR(50) NULL,
    Remarks NVARCHAR(MAX) NULL,
    
    -- Audit
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Indexes
    INDEX IX_Tickets_TicketNumber (TicketNumber),
    INDEX IX_Tickets_Status (Status),
    INDEX IX_Tickets_Module (Module),
    INDEX IX_Tickets_CRDate (CRDate),
    INDEX IX_Tickets_Developer (Developer),
    INDEX IX_Tickets_SEName (SEName)
);
```

### Table 2: Users
```sql
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy NVARCHAR(100) NULL,
    LastLogin DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    INDEX IX_Users_Username (Username),
    INDEX IX_Users_Role (Role),
    
    CONSTRAINT CHK_Role CHECK (Role IN ('Admin', 'Support Engineer', 'Developer', 'Manager'))
);
```

### Table 3: TicketCounter
```sql
CREATE TABLE TicketCounter (
    Year INT PRIMARY KEY,
    Counter INT NOT NULL DEFAULT 0,
    LastUpdated DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

### Table 4: AuditLogs
```sql
CREATE TABLE AuditLogs (
    AuditId INT PRIMARY KEY IDENTITY(1,1),
    TicketId INT NOT NULL,
    Action NVARCHAR(50) NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    Changes NVARCHAR(MAX) NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX IX_AuditLogs_TicketId (TicketId),
    INDEX IX_AuditLogs_Timestamp (Timestamp),
    
    CONSTRAINT FK_AuditLogs_Tickets FOREIGN KEY (TicketId) REFERENCES Tickets(TicketId)
);
```

### Table 5: ModuleMappings (Optional - replaces hardcoded dictionaries)
```sql
CREATE TABLE ModuleMappings (
    MappingId INT PRIMARY KEY IDENTITY(1,1),
    Module NVARCHAR(100) NOT NULL UNIQUE,
    SupportEngineer NVARCHAR(100) NOT NULL,
    Developer NVARCHAR(100) NOT NULL,
    DeveloperEmail NVARCHAR(200) NOT NULL,
    
    INDEX IX_ModuleMappings_Module (Module)
);
```

---

## 🏗️ ASP.NET Core Architecture

### Project Structure
```
ERPTicketing.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── TicketsController.cs
│   ├── DashboardController.cs
│   └── UsersController.cs
├── Services/
│   ├── TicketService.cs
│   ├── UserService.cs
│   ├── EmailService.cs
│   ├── AssignmentService.cs
│   └── DashboardService.cs
├── Repositories/
│   ├── ITicketRepository.cs
│   ├── TicketRepository.cs
│   ├── IUserRepository.cs
│   └── UserRepository.cs
├── Models/
│   ├── Ticket.cs
│   ├── User.cs
│   ├── TicketCounter.cs
│   └── AuditLog.cs
├── DTOs/
│   ├── TicketCreateDto.cs
│   ├── TicketUpdateDto.cs
│   ├── StatusUpdateDto.cs
│   └── UserDto.cs
├── Data/
│   └── ApplicationDbContext.cs
├── Middleware/
│   ├── AuthenticationMiddleware.cs
│   └── ExceptionMiddleware.cs
├── Helpers/
│   ├── PasswordHasher.cs
│   ├── JwtHelper.cs
│   └── ModuleMappings.cs
└── Program.cs
```

---

## 🔧 Key Components

### 1. Ticket Service (Business Logic)

```csharp
public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IAssignmentService _assignmentService;
    private readonly IEmailService _emailService;
    
    public async Task<Ticket> CreateTicketAsync(TicketCreateDto dto, string createdBy)
    {
        // Generate ticket number (YYYY-00001 format)
        var ticketNumber = await GenerateTicketNumberAsync();
        
        // Auto-assign based on module
        var assignment = _assignmentService.GetAssignment(dto.Module);
        
        // Create ticket entity
        var ticket = new Ticket
        {
            TicketNumber = ticketNumber,
            Customer = dto.Customer,
            Module = dto.Module,
            CRType = dto.CRType,
            IssueType = dto.IssueType,
            Description = dto.Description,
            Priority = dto.Priority ?? "Medium",
            Status = "Assigned",
            SEName = assignment.SupportEngineer,
            Developer = assignment.Developer,
            DeveloperEmail = assignment.DeveloperEmail,
            CRDate = DateTime.Today,
            CRTime = DateTime.Now.TimeOfDay,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        // Save to database
        await _ticketRepository.CreateAsync(ticket);
        
        // Send email notification (background)
        _ = _emailService.SendAssignmentEmailAsync(ticket);
        
        return ticket;
    }
    
    private async Task<string> GenerateTicketNumberAsync()
    {
        var currentYear = DateTime.Now.Year;
        var counter = await _ticketRepository.IncrementCounterAsync(currentYear);
        return $"{currentYear}-{counter:D5}";
    }
    
    public async Task<Ticket> UpdateStatusAsync(string ticketNumber, string newStatus, string username)
    {
        var ticket = await _ticketRepository.GetByTicketNumberAsync(ticketNumber);
        
        if (ticket == null)
            throw new NotFoundException("Ticket not found");
        
        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;
        
        // If completing, capture completion details
        if (newStatus == "Completed")
        {
            ticket.CompletedOn = DateTime.Today;
            ticket.CompletedTime = DateTime.Now.TimeOfDay;
            ticket.CompletedBy = username;
            ticket.TimeDuration = $"{(DateTime.Today - ticket.CRDate).Days} days";
        }
        
        await _ticketRepository.UpdateAsync(ticket);
        
        return ticket;
    }
}
```

### 2. Assignment Service

```csharp
public class AssignmentService : IAssignmentService
{
    private readonly Dictionary<string, (string SE, string Dev, string Email)> _moduleMappings;
    
    public AssignmentService()
    {
        // Load from config or database
        _moduleMappings = new Dictionary<string, (string, string, string)>
        {
            ["PO"] = ("Seenivasan", "Mariyaiya", "mariyaiya.m@kalsofte.com"),
            ["Invy"] = ("Seenivasan", "Mariyaiya", "mariyaiya.m@kalsofte.com"),
            ["PPC"] = ("Vignesh", "Annamalai", "annamalai.s@kalsofte.com"),
            ["Payroll"] = ("Palanivel", "Sasi", "sasikumar.r@kalsofte.com"),
            ["MIS"] = ("Palanivel", "Mariya", "maria@kalsofte.com"),
            ["FA"] = ("Palanivel", "Sasi", "sasikumar.r@kalsofte.com"),
            // ... rest of mappings
        };
    }
    
    public AssignmentResult GetAssignment(string module)
    {
        if (_moduleMappings.TryGetValue(module, out var mapping))
        {
            return new AssignmentResult
            {
                SupportEngineer = mapping.SE,
                Developer = mapping.Dev,
                DeveloperEmail = mapping.Email
            };
        }
        
        return new AssignmentResult
        {
            SupportEngineer = "Unassigned",
            Developer = "Unassigned",
            DeveloperEmail = ""
        };
    }
}
```

### 3. Repository Pattern (ADO.NET)

```csharp
public class TicketRepository : ITicketRepository
{
    private readonly string _connectionString;
    
    public TicketRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }
    
    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        var command = new SqlCommand(@"
            INSERT INTO Tickets (
                TicketNumber, Customer, Module, CRType, IssueType, Description,
                Priority, Status, SEName, Developer, DeveloperEmail,
                CRDate, CRTime, CreatedBy, CreatedAt, UpdatedAt
            ) VALUES (
                @TicketNumber, @Customer, @Module, @CRType, @IssueType, @Description,
                @Priority, @Status, @SEName, @Developer, @DeveloperEmail,
                @CRDate, @CRTime, @CreatedBy, @CreatedAt, @UpdatedAt
            );
            SELECT CAST(SCOPE_IDENTITY() as int);
        ", connection);
        
        // Add parameters
        command.Parameters.AddWithValue("@TicketNumber", ticket.TicketNumber);
        command.Parameters.AddWithValue("@Customer", ticket.Customer);
        // ... rest of parameters
        
        ticket.TicketId = (int)await command.ExecuteScalarAsync();
        
        return ticket;
    }
    
    public async Task<int> IncrementCounterAsync(int year)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            // Check if counter exists for year
            var checkCommand = new SqlCommand(
                "SELECT Counter FROM TicketCounter WHERE Year = @Year", 
                connection, transaction);
            checkCommand.Parameters.AddWithValue("@Year", year);
            
            var existingCounter = await checkCommand.ExecuteScalarAsync();
            
            if (existingCounter == null)
            {
                // Create new counter for year
                var insertCommand = new SqlCommand(
                    "INSERT INTO TicketCounter (Year, Counter) VALUES (@Year, 1)", 
                    connection, transaction);
                insertCommand.Parameters.AddWithValue("@Year", year);
                await insertCommand.ExecuteNonQueryAsync();
                
                await transaction.CommitAsync();
                return 1;
            }
            else
            {
                // Increment existing counter
                var updateCommand = new SqlCommand(
                    "UPDATE TicketCounter SET Counter = Counter + 1 WHERE Year = @Year; SELECT Counter FROM TicketCounter WHERE Year = @Year", 
                    connection, transaction);
                updateCommand.Parameters.AddWithValue("@Year", year);
                
                var newCounter = (int)await updateCommand.ExecuteScalarAsync();
                
                await transaction.CommitAsync();
                return newCounter;
            }
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

### 4. Authentication (JWT)

```csharp
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    
    public async Task<LoginResult> LoginAsync(string username, string password)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        
        if (user == null || !_passwordHasher.VerifyPassword(password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid username or password");
        }
        
        var token = GenerateJwtToken(user);
        
        return new LoginResult
        {
            AccessToken = token,
            TokenType = "bearer",
            User = new UserDto
            {
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role
            }
        };
    }
    
    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("FullName", user.FullName)
        };
        
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## 📧 Email Listener (Background Service)

```csharp
public class EmailListenerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailListenerService> _logger;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckNewEmailsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking emails");
            }
            
            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }
    
    private async Task CheckNewEmailsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var ticketService = scope.ServiceProvider.GetRequiredService<ITicketService>();
        
        var emailAddress = _configuration["Email:Address"];
        var emailPassword = _configuration["Email:Password"];
        var imapServer = _configuration["Email:ImapServer"];
        
        using var client = new ImapClient();
        await client.ConnectAsync(imapServer, 993, true);
        await client.AuthenticateAsync(emailAddress, emailPassword);
        
        var inbox = client.Inbox;
        await inbox.OpenAsync(FolderAccess.ReadWrite);
        
        var unreadMessages = await inbox.SearchAsync(SearchQuery.NotSeen);
        
        foreach (var uid in unreadMessages)
        {
            var message = await inbox.GetMessageAsync(uid);
            
            var parsed = ParseEmailSubject(message.Subject);
            if (parsed != null)
            {
                var ticket = new TicketCreateDto
                {
                    Customer = parsed.Customer,
                    Module = parsed.Module,
                    CRType = parsed.CRType,
                    IssueType = parsed.IssueType,
                    Description = $"{parsed.Description}\n\n{message.TextBody}",
                    Priority = "Medium"
                };
                
                await ticketService.CreateTicketAsync(ticket, "email_system");
                await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true);
                
                _logger.LogInformation($"Created ticket from email: {message.Subject}");
            }
        }
        
        await client.DisconnectAsync(true);
    }
    
    private EmailParsedData ParseEmailSubject(string subject)
    {
        var parts = subject.Split('|').Select(p => p.Trim()).ToArray();
        
        if (parts.Length < 5)
            return null;
        
        return new EmailParsedData
        {
            Customer = parts[0],
            Module = parts[1],
            CRType = parts[2],
            IssueType = parts[3],
            Description = string.Join(" | ", parts.Skip(4))
        };
    }
}
```

---

## 🔄 Data Migration Script

### MongoDB to SQL Server

```csharp
public class DataMigrationService
{
    public async Task MigrateAsync()
    {
        // 1. Connect to MongoDB
        var mongoClient = new MongoClient("mongodb://localhost:27017");
        var mongoDb = mongoClient.GetDatabase("erp_ticketing");
        var ticketsCollection = mongoDb.GetCollection<BsonDocument>("tickets");
        
        // 2. Connect to SQL Server
        var sqlConnection = new SqlConnection(_connectionString);
        await sqlConnection.OpenAsync();
        
        // 3. Migrate tickets
        var tickets = await ticketsCollection.Find(new BsonDocument()).ToListAsync();
        
        foreach (var ticket in tickets)
        {
            var command = new SqlCommand(@"
                INSERT INTO Tickets (
                    TicketNumber, Customer, Module, CRType, IssueType, Description,
                    Priority, Status, SEName, Developer, DeveloperEmail,
                    CRDate, CRTime, CompletedOn, CompletedBy, TimeDuration,
                    CreatedBy, CreatedAt, UpdatedAt, Remarks
                ) VALUES (
                    @TicketNumber, @Customer, @Module, @CRType, @IssueType, @Description,
                    @Priority, @Status, @SEName, @Developer, @DeveloperEmail,
                    @CRDate, @CRTime, @CompletedOn, @CompletedBy, @TimeDuration,
                    @CreatedBy, @CreatedAt, @UpdatedAt, @Remarks
                )
            ", sqlConnection);
            
            command.Parameters.AddWithValue("@TicketNumber", ticket["ticket_number"].AsString);
            command.Parameters.AddWithValue("@Customer", ticket["customer"].AsString);
            command.Parameters.AddWithValue("@Module", ticket["module"].AsString);
            // ... add all parameters
            
            await command.ExecuteNonQueryAsync();
        }
        
        // 4. Migrate users (similar pattern)
        // 5. Migrate audit logs (similar pattern)
        
        Console.WriteLine($"Migrated {tickets.Count} tickets successfully");
    }
}
```

---

## 🎨 Frontend Changes

### Update API Base URL

**File: `/app/frontend/src/App.js`**

```javascript
// Change from:
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// To:
const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://your-domain.com/api';
```

### No other frontend changes needed!
All API contracts match - just change the URL.

---

## 📦 NuGet Packages Required

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
  <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.0" />
  <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
  <PackageReference Include="System.Data.SqlClient" Version="4.8.6" />
  <PackageReference Include="MailKit" Version="4.3.0" />
  <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
</ItemGroup>
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] UAT completed successfully on Phase-1
- [ ] All test cases passed
- [ ] Production data backed up
- [ ] SQL Server environment ready
- [ ] .NET 8.0 SDK installed

### Development Phase
- [ ] SQL Server schema created
- [ ] ASP.NET Core project structure set up
- [ ] All repositories implemented
- [ ] All services ported
- [ ] Business logic migrated
- [ ] Email listener service created
- [ ] JWT authentication configured
- [ ] Module mappings ported

### Testing Phase
- [ ] Unit tests written (repositories, services)
- [ ] Integration tests written (API endpoints)
- [ ] All Phase-1 test cases re-run on Phase-2
- [ ] Performance testing completed
- [ ] Security audit passed

### Data Migration
- [ ] Migration script tested on copy of data
- [ ] Ticket numbers preserved
- [ ] User accounts migrated
- [ ] Audit logs migrated
- [ ] Data validation completed

### Deployment
- [ ] SQL Server database deployed
- [ ] ASP.NET Core API deployed (IIS/Azure)
- [ ] Frontend updated with new API URL
- [ ] Email credentials configured
- [ ] SSL certificates configured
- [ ] Monitoring set up

### Post-Migration
- [ ] All services running
- [ ] Email-to-ticket working
- [ ] Dashboard data accurate
- [ ] User login working
- [ ] Performance acceptable
- [ ] No data loss verified

---

## 📊 Estimated Effort

| Task | Estimated Time |
|------|---------------|
| SQL Server schema | 2 days |
| Repository layer | 3 days |
| Service layer | 4 days |
| Controllers/APIs | 3 days |
| Email listener | 2 days |
| Authentication | 2 days |
| Testing | 5 days |
| Data migration | 2 days |
| Deployment | 2 days |
| **Total** | **25 days** |

---

## 🎯 Success Metrics

After migration, verify:

✅ **Functional Parity:**
- All 10 UAT test cases pass
- Zero feature regression
- Same user experience

✅ **Performance:**
- API response < 500ms (95th percentile)
- Dashboard loads < 2 seconds
- Email processing < 60 seconds

✅ **Security:**
- All OWASP Top 10 addressed
- SQL injection protected (parameterized queries)
- XSS protection enabled
- HTTPS enforced

✅ **Reliability:**
- 99.9% uptime
- Automated backups daily
- Disaster recovery plan tested

---

## 📞 Support During Migration

**Reference Documentation:**
- Phase-1 system (running reference)
- API contracts (from Swagger/docs)
- Business logic (from Phase-1 code)
- Test cases (from UAT)

**Tools:**
- SQL Server Management Studio
- Visual Studio 2022
- Postman (API testing)
- Azure Data Studio

---

**Migration Guide Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** ✅ Ready for Phase-2 Planning