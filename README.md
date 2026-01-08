# ERP Ticketing Management System

A comprehensive ticketing system that automatically converts emails into tickets, assigns them to appropriate team members, and provides real-time dashboards for tracking.

## 🚀 Features

### Core Functionality
- ✅ **Email-to-Ticket Automation**: Monitors `erpkalsofte@gmail.com` and automatically creates tickets from emails
- ✅ **Auto-Assignment**: Automatically assigns Support Engineers and Developers based on Module
- ✅ **Year-wise Ticket Numbering**: Format `YYYY-00001` with automatic reset each year
- ✅ **Status Lifecycle**: New → Assigned → In Progress → Completed → Closed
- ✅ **Automatic Email Notifications**: Sends assignment emails to developers with CC to development@kalsofte.com
- ✅ **Completion Automation**: Auto-captures completion date, time, user, and duration
- ✅ **Role-based Access Control**: Admin, Support Engineer, Developer, Manager roles
- ✅ **Real-time Dashboard**: KPIs, charts, and analytics

### Email Subject Format (MANDATORY)
```
Customer | Module | CRType | Issue Type | Description
```

**Example:**
```
Sky Cotex | PPC | Customer CR | Operational Issue | Rate Master Issue
```

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB
- **Charts**: Recharts
- **Authentication**: JWT tokens

### Services Running
1. **Backend API** (Port 8001): REST API for all operations
2. **Frontend** (Port 3000): React web application
3. **Email Listener**: Background service monitoring incoming emails
4. **MongoDB**: Database server

## 📋 Ticket Structure (24 Fields - Google Sheet Compatible)

1. T.No (Ticket Number)
2. Customer
3. CR Type (Customer CR / Internal CR)
4. Issue Type
5. Type
6. CR Date
7. CR Time
8. Module
9. Description
10. AMC Cost
11. PR Approval
12. Priority (Low/Medium/High)
13. Status (New/Assigned/In Progress/Completed/Closed/Pending)
14. SE's Name (Support Engineer - Auto-assigned)
15. Developer (Auto-assigned)
16. Planned Date
17. Commitment Date
18. Completed on
19. Completed by
20. Completed Time
21. Time Duration
22. EXE Sent
23. Reason for the Issue
24. Customer Call
25. Remarks

## 👥 Default User Accounts

### Admin
- Username: `admin`
- Password: `admin123`
- Access: Full control

### Support Engineers
- `seenivasan` / `support123`
- `vignesh` / `support123`
- `mariyaiya_se` / `support123`
- `palanivel` / `support123`
- `muthuvel` / `support123`

### Developers
- `annamalai` / `dev123`
- `mariyaiya_dev` / `dev123`
- `sasi` / `dev123`
- `mariya` / `dev123`
- `mohan` / `dev123`
- `udhay` / `dev123`

### Manager
- `manager` / `manager123`
- Access: Read-only + Dashboard

## 🔧 Setup Instructions

### 1. Email Configuration (Required for Email-to-Ticket)

Edit `/app/backend/.env`:

```bash
# Email Configuration
EMAIL_ADDRESS=erpkalsofte@gmail.com
EMAIL_PASSWORD=your-gmail-app-password-here
EMAIL_IMAP_SERVER=imap.gmail.com
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
DEVELOPMENT_CC_EMAIL=development@kalsofte.com
```

**To get Gmail App Password:**
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable it)
3. App Passwords → Generate password for "Mail"
4. Copy the 16-character password to `EMAIL_PASSWORD`

### 2. Restart Services

After updating credentials:
```bash
sudo supervisorctl restart all
```

### 3. Monitor Email Listener

```bash
# Check email listener logs
sudo supervisorctl tail -f email_listener

# Check email listener status
sudo supervisorctl status email_listener
```

## 📊 Module Mappings (Pre-configured)

### Support Engineers by Module
- **Seenivasan**: PO, Invy, RMI, HT RMI, WVG Yinvy, Knitting Yinvy, Import, Paper Import, DSales, Paper Sales, WSales, SSales, ESales, WVG ESales, Knitting Sales, WVG Sales, HT Sales, Canteen, GMS, Txn Approval, Web Reports, System Admin, Automail
- **Vignesh**: PPC, Pre Spg, Spg, Post Spg, QC, Knitting Prodn, WVG Prep, WVG Prodn, Paper Prodn, HT Prodn
- **Mariyaiya**: MMS, EMS, Power
- **Palanivel**: Payroll, HR, FA, FAD, Costing, MIS, WVG MIS, User Rights
- **Muthuvel**: Paper RMI

### Developers by Module
- **Mariyaiya**: PO, Invy, RMI, Paper RMI, HT RMI, WVG Yinvy, Knitting Yinvy, MMS, EMS, Power, Canteen, GMS
- **Annamalai**: PPC, Pre Spg, Spg, Post Spg, QC, Knitting Prodn, WVG Prep, WVG Prodn, Paper Prodn, DSales, Paper Sales, WSales, SSales, ESales, WVG ESales, Knitting Sales, WVG Sales, FGI
- **Sasi**: Import, Paper Import, Payroll, HR, FA, FAD, Costing, WVG MIS, System Admin
- **Mariya**: HT Prodn, HT Sales, MIS, User Rights, PPS
- **Mohan Babu**: PO Approval, Txn Approval, Web Reports, Automail, CSM
- **Udhay**: All Modules Report

## 🎯 Usage

### Creating Tickets

#### Method 1: Send Email (Automatic)
Send email to `erpkalsofte@gmail.com` with subject:
```
Sky Cotex | PPC | Customer CR | Operational Issue | Rate Master Issue
```

The system will:
1. Parse the email
2. Create ticket with auto-generated number
3. Auto-assign SE and Developer
4. Send notification email to developer
5. Status set to "Assigned"

#### Method 2: Web Interface (Manual)
1. Login as Admin or Support Engineer
2. Click "Create Ticket"
3. Fill in the form
4. System auto-assigns based on module
5. Email sent automatically

### Dashboard Features
- Total Tickets, Pending, Completed, Closed counts
- Status Distribution (Pie Chart)
- Issue Type Distribution (Bar Chart)
- CR Type Distribution (Pie Chart)
- Module-wise Pending (Top 10)
- Developer-wise Pending
- Support Engineer-wise Pending

### Filters Available
- Status
- Module
- Customer (search)
- Developer
- Support Engineer
- CR Type
- Issue Type
- Date Range (From/To)

## 🔒 Role-based Permissions

| Action | Admin | Support Engineer | Developer | Manager |
|--------|-------|------------------|-----------|---------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Tickets | ✅ | ✅ | ✅ | ✅ |
| Create Tickets | ✅ | ✅ | ❌ | ❌ |
| Edit Tickets | ✅ | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ❌ |
| Edit Completed Tickets | ✅ (All fields) | ❌ | ❌ (Remarks only) | ❌ |

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - List tickets (with filters)
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}` - Update ticket
- `PUT /api/tickets/{id}/status` - Update status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Metadata
- `GET /api/modules` - Get all modules
- `GET /api/developers` - Get all developers
- `GET /api/support-engineers` - Get all support engineers

## 🧪 Testing

### Test Ticket Creation
```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Create ticket
curl -X POST http://localhost:8001/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer": "Test Customer",
    "module": "PPC",
    "cr_type": "Customer CR",
    "issue_type": "Test Issue",
    "description": "Test ticket creation",
    "priority": "Medium"
  }'
```

### Check Dashboard Stats
```bash
curl -X GET http://localhost:8001/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

## 📂 Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── email_listener.py      # Email monitoring service
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React app
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── TicketList.js
│   │   │   ├── TicketDetails.js
│   │   │   └── CreateTicket.js
│   │   └── index.js
│   ├── package.json          # Node dependencies
│   └── .env                  # Frontend configuration
└── README.md                 # This file
```

## 🔍 Monitoring & Logs

### Check Service Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
# Backend logs
sudo supervisorctl tail -f backend

# Frontend logs
sudo supervisorctl tail -f frontend

# Email listener logs
sudo supervisorctl tail -f email_listener
```

### Restart Services
```bash
# Restart all
sudo supervisorctl restart all

# Restart specific service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart email_listener
```

## ⚠️ Important Notes

1. **Email Credentials**: Email listener will be in standby mode until valid Gmail App Password is configured
2. **Ticket Numbering**: Year resets automatically (2026-00001, 2026-00002, etc.)
3. **Completed Tickets**: Once status is "Completed", only remarks can be edited (except by Admin)
4. **Auto-Assignment**: Based on module mappings - cannot be manually overridden during creation
5. **Email Format**: Subject format is strictly validated - invalid formats are logged but not processed

## 🚨 Troubleshooting

### Email Listener Not Working
1. Check credentials in `/app/backend/.env`
2. Verify Gmail App Password (not regular password)
3. Check logs: `sudo supervisorctl tail email_listener`
4. Restart: `sudo supervisorctl restart email_listener`

### Tickets Not Creating
1. Check backend logs: `sudo supervisorctl tail backend`
2. Verify MongoDB is running: `sudo supervisorctl status mongodb`
3. Test API: `curl http://localhost:8001/api/health`

### Frontend Not Loading
1. Check frontend logs: `sudo supervisorctl tail frontend`
2. Verify backend URL in `/app/frontend/.env`
3. Restart: `sudo supervisorctl restart frontend`

## 📞 Support

For issues or questions:
- Check logs first: `sudo supervisorctl tail <service_name>`
- Verify all services running: `sudo supervisorctl status`
- Check email format matches required pattern
- Ensure email credentials are valid App Passwords

## 🎉 Success Criteria (All Completed)

✅ Zero manual ticket entry
✅ Zero manual assignment
✅ Automatic email notification
✅ Live ERP dashboard
✅ Exact match with Google Sheet logic
✅ Year-wise ticket numbering
✅ Status lifecycle enforcement
✅ Role-based access control
✅ Time duration auto-calculation
✅ Completion automation
✅ Comprehensive filtering
✅ Real-time analytics
