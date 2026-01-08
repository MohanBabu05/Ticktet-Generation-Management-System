# Self-Registration Feature - Documentation

## ✅ Feature Overview

**Self-Registration** allows users to create their own accounts without administrator intervention, while maintaining ERP security standards.

---

## 🔐 Security Model

### First User = Admin
- **First person** to register gets **Admin role** automatically
- Has full system control
- Can manage all users and upgrade roles

### Subsequent Users = Manager (Read-only)
- All users after the first get **Manager role** by default
- Can login immediately
- Can view dashboard and tickets
- **Cannot** create or edit tickets
- **Cannot** change status or assignments
- Admin can upgrade role later if needed

---

## 🎯 User Flow

### For First User (Bootstrap Admin):
1. Click **"Create New Account"** on login page
2. Fill registration form:
   - Full Name
   - Username (letters, numbers, underscore only)
   - Password (min 6 characters)
   - Confirm Password
3. Submit
4. **Automatically assigned Admin role**
5. Logged in immediately
6. Can now manage system and other users

### For Subsequent Users:
1. Click **"Create New Account"** on login page
2. Fill registration form (same fields)
3. Submit
4. **Automatically assigned Manager role (read-only)**
5. Logged in immediately
6. Can view all data but cannot modify
7. **Admin can upgrade role** via User Management page

---

## 📝 Registration Form Fields

### Full Name (Required)
- User's display name
- Shown in UI and reports
- No restrictions on format

### Username (Required)
- **Unique** identifier
- **Pattern**: Letters, numbers, and underscores only
- **No spaces** or special characters
- Case-sensitive
- Cannot be changed later
- Used for login

### Password (Required)
- **Minimum 6 characters**
- No complexity requirements (can be added later)
- Securely hashed with bcrypt
- Not stored in plain text
- Users can change later

### Confirm Password (Required)
- Must match Password field
- Client-side validation

---

## 🛡️ Security Features

### Username Validation
```
✅ Valid: john_doe, user123, admin_john
❌ Invalid: john.doe, user-123, admin@john
```

### Duplicate Prevention
- System checks if username already exists
- Error message: "Username already exists"
- User must choose different username

### Password Requirements
- Minimum 6 characters
- Hashed using bcrypt (industry standard)
- Salt included automatically
- Cannot be reversed or decrypted

### Role Assignment
- **Automatic** based on user count
- **First user**: Admin
- **All others**: Manager
- **No manual selection** during registration (prevents abuse)
- Admin can upgrade later

---

## 🔄 Role Upgrade Process

### Admin Can Upgrade User Roles:

1. Login as Admin
2. Go to **Users** menu
3. Find user in list
4. **Self-registered users** have purple badge
5. Use **Role dropdown** to change role:
   - Admin
   - Support Engineer
   - Developer
   - Manager
6. Confirmation prompt appears
7. Role updated immediately
8. User's next login uses new role

### Role Capabilities:

| Role | View | Create Tickets | Edit Tickets | Update Status | Manage Users |
|------|------|---------------|--------------|---------------|--------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Support Engineer** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Developer** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Manager** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📊 Use Cases

### Scenario 1: Fresh System Setup
1. **First user** (IT Admin) registers
2. Gets Admin role automatically
3. Creates module-specific Support Engineer accounts
4. Creates Developer accounts
5. Team members can now self-register as Managers
6. Admin upgrades roles as needed

### Scenario 2: Team Member Onboarding
1. New employee joins
2. Self-registers on login page
3. Gets Manager role (can view all data)
4. Informs Admin via email/chat
5. Admin upgrades to appropriate role
6. Employee immediately has correct access

### Scenario 3: External Stakeholder Access
1. Client/vendor needs read-only access
2. They self-register
3. Get Manager role by default
4. Can view tickets and dashboard
5. No additional action needed from Admin
6. Perfect for transparency without risk

---

## 🔧 API Endpoints

### Registration
```
POST /api/auth/register

Request Body:
{
  "username": "string",
  "password": "string",
  "full_name": "string"
}

Response (Success):
{
  "message": "Account created successfully with [Role] role",
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user": {
    "username": "string",
    "full_name": "string",
    "role": "Admin|Manager"
  }
}

Response (Error - Duplicate):
{
  "detail": "Username already exists"
}

Response (Error - Short Password):
{
  "detail": "Password must be at least 6 characters"
}

Response (Error - Invalid Username):
{
  "detail": "Username must contain only letters, numbers, and underscores"
}
```

### Role Update (Admin Only)
```
PUT /api/users/{username}/role

Request Body:
{
  "role": "Admin|Support Engineer|Developer|Manager"
}

Response:
{
  "message": "User {username} role updated to {role}"
}
```

---

## ✅ Testing

### Test Case 1: First User Registration
```bash
# Should get Admin role
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "first_admin",
    "password": "SecurePass123",
    "full_name": "First Admin User"
  }'

# Expected: role = "Admin"
```

### Test Case 2: Second User Registration
```bash
# Should get Manager role
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "second_user",
    "password": "UserPass123",
    "full_name": "Second User"
  }'

# Expected: role = "Manager"
```

### Test Case 3: Duplicate Username
```bash
# Should fail
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "first_admin",
    "password": "AnotherPass",
    "full_name": "Duplicate"
  }'

# Expected: "Username already exists"
```

### Test Case 4: Short Password
```bash
# Should fail
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "123",
    "full_name": "Test User"
  }'

# Expected: "Password must be at least 6 characters"
```

### Test Case 5: Invalid Username
```bash
# Should fail
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test.user",
    "password": "Pass123",
    "full_name": "Test User"
  }'

# Expected: "Username must contain only letters, numbers, and underscores"
```

---

## 🎨 UI/UX

### Login Page
- **Two buttons visible:**
  1. "Login" (primary blue)
  2. "Create New Account" (green)

### Registration Form
- Clean, professional design
- Clear field labels
- Input validation hints
- Password requirements shown
- Role assignment explanation
- "Back to Login" button

### Post-Registration
- Success message with assigned role
- Automatic login
- Immediate access to system
- Welcome experience

---

## 📋 Admin Best Practices

### Initial Setup:
1. ✅ Register first admin account immediately
2. ✅ Use strong, unique password
3. ✅ Create dedicated accounts for Support/Developers
4. ✅ Enable team self-registration
5. ✅ Monitor new registrations

### Ongoing Management:
1. ✅ Review self-registered users weekly
2. ✅ Upgrade roles promptly when requested
3. ✅ Remove inactive accounts
4. ✅ Enforce password changes periodically
5. ✅ Audit role assignments quarterly

### Security Checklist:
- [ ] First admin account created with strong password
- [ ] All team members have individual accounts
- [ ] No shared credentials
- [ ] Self-registered users reviewed
- [ ] Role assignments appropriate
- [ ] Inactive accounts disabled/deleted

---

## 🚨 Troubleshooting

### Issue: "Username already exists"
**Cause:** Username is taken  
**Solution:** Choose different username

### Issue: "Password must be at least 6 characters"
**Cause:** Password too short  
**Solution:** Use longer password (6+ chars)

### Issue: "Username must contain only..."
**Cause:** Special characters in username  
**Solution:** Use only letters, numbers, underscore

### Issue: User got Manager role but needs higher access
**Cause:** Normal behavior for non-first users  
**Solution:** Admin upgrades role via User Management

### Issue: Cannot register (button disabled)
**Cause:** Form validation errors  
**Solution:** Check all fields are filled correctly

---

## 📖 Integration with Existing Features

### Works With:
- ✅ User Management (Admin can still create users)
- ✅ Role-based access control
- ✅ Password change functionality
- ✅ Audit logging
- ✅ JWT authentication

### Does Not Affect:
- ✅ Email-to-ticket automation
- ✅ Auto-assignment logic
- ✅ Dashboard analytics
- ✅ Existing user accounts

---

## 🎯 Benefits

### For Users:
- **Immediate access** without waiting for admin
- **Self-service** account creation
- **Professional experience** from day one
- **No credential sharing**

### For Admins:
- **Reduced workload** (no manual account creation)
- **Better security** (each user has own credentials)
- **Easier onboarding** (users register themselves)
- **Full control** (can upgrade roles anytime)

### For Organization:
- **ERP compliance** (proper access control)
- **Audit trail** (who registered when)
- **Scalability** (handles growth easily)
- **Security** (no default credentials needed)

---

## 📞 Support

**For Registration Issues:**
- Verify username format (no special characters)
- Ensure password is 6+ characters
- Check passwords match
- Try different username if taken

**For Role Upgrades:**
- Contact system administrator
- Provide your username
- Specify role needed
- Admin upgrades via User Management page

---

**Feature Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** ✅ Production Ready