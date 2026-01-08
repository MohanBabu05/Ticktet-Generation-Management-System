# UAT (User Acceptance Testing) Guide

## 📋 UAT Overview

**Purpose:** Validate ERP Ticketing System functionality before Phase-2 migration to ASP.NET Core + SQL Server

**Current System:** FastAPI + React + MongoDB (Migration-ready architecture)

**Status:** ✅ Security fixes approved, ready for UAT

---

## 🎯 UAT Objectives

### Primary Goals
1. ✅ Validate email-to-ticket automation
2. ✅ Verify auto-assignment accuracy (40+ modules)
3. ✅ Test status lifecycle workflow
4. ✅ Confirm dashboard analytics accuracy
5. ✅ Validate user management and security
6. ✅ Test role-based access control

### Success Criteria
- Email creates tickets correctly
- Module mappings assign right SE/Developer
- Ticket numbering follows YYYY-00001 format
- Status flow enforced (New → Assigned → In Progress → Completed → Closed)
- Dashboard reflects real-time data
- No security vulnerabilities
- All 4 roles work as expected

---

## 🔧 Pre-UAT Setup (Administrator)

### Step 1: Email Configuration

**Get Gmail App Password:**
1. Login to Gmail: erpkalsofte@gmail.com
2. Go to Google Account → Security
3. Enable 2-Step Verification (if not enabled)
4. Click "App Passwords"
5. Generate password for "Mail" app
6. Copy 16-character password (e.g., `abcd efgh ijkl mnop`)

**Configure System:**
```bash
# Edit backend environment file
nano /app/backend/.env

# Update this line (remove spaces from app password):
EMAIL_PASSWORD=abcdefghijklmnop

# Save and exit (Ctrl+X, Y, Enter)

# Restart all services
sudo supervisorctl restart all

# Verify email listener is active (wait 10 seconds)
sudo supervisorctl tail -20 email_listener

# Should show: "Monitoring: erpkalsofte@gmail.com"
# NOT: "Email credentials not configured"
```

### Step 2: Create Real User Accounts

**Login as default admin:**
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`

**Create your real accounts:**

1. Navigate to **Users** (top menu)
2. Click **Create New User**

**Create these accounts:**

**Your Admin:**
```
Username: admin_yourname (replace with your name)
Full Name: Your Full Name
Password: [Your secure password]
Role: Admin
```

**Support Engineers (example):**
```
Username: seenivasan_se
Full Name: Seenivasan
Password: [Secure password]
Role: Support Engineer
```

**Developers (example):**
```
Username: annamalai_dev
Full Name: Annamalai
Password: [Secure password]
Role: Developer
```

**Manager (example):**
```
Username: manager_test
Full Name: Test Manager
Password: [Secure password]
Role: Manager
```

3. **Communicate credentials securely** to each user (not via email!)
4. **Test each account** - login and verify role access
5. **(Optional)** Delete default accounts after confirming real accounts work

### Step 3: System Health Check

```bash
# Check all services running
sudo supervisorctl status

# Expected output:
# backend          RUNNING
# email_listener   RUNNING
# frontend         RUNNING
# mongodb          RUNNING

# Test backend API
curl http://localhost:8001/api/health

# Expected: {"status":"healthy","service":"ERP Ticketing Management System"}

# Test frontend
curl http://localhost:3000 | grep "ERP Ticketing"

# Should return HTML with title
```

---

## 📝 UAT Test Cases

### Test Case 1: Email-to-Ticket Creation

**Objective:** Verify email automatically creates ticket with correct assignment

**Pre-requisites:**
- Email credentials configured
- Email listener running

**Steps:**
1. Send email to: `erpkalsofte@gmail.com`
2. Subject format: `Customer | Module | CRType | Issue Type | Description`
3. Example subject: `Sky Cotex | PPC | Customer CR | Operational Issue | Rate Master Bug`
4. Body: Add detailed description

**Expected Result:**
- Within 60 seconds, ticket created
- Ticket number: 2026-XXXXX (year-based)
- Status: Assigned
- SE: Vignesh (for PPC module)
- Developer: Annamalai (for PPC module)
- Email sent to: annamalai.s@kalsofte.com
- CC: development@kalsofte.com

**Validation:**
```bash
# Check email listener logs
sudo supervisorctl tail -50 email_listener

# Should show:
# "Found 1 new email(s)"
# "Processing email:"
# "Created ticket 2026-XXXXX"
```

**Login to UI and verify:**
- Dashboard → Total tickets increased
- Tickets → New ticket appears in list
- Click ticket → Verify all fields populated

**Test Data - Multiple Modules:**

| Email Subject | Expected SE | Expected Developer |
|--------------|-------------|-------------------|
| ABC Mills \| Payroll \| Internal CR \| Bug \| Salary issue | Palanivel | Sasi |
| XYZ Ltd \| MIS \| Customer CR \| Report \| New dashboard | Palanivel | Mariya |
| Test Co \| FA \| Customer CR \| Data \| Ledger wrong | Palanivel | Sasi |
| Demo Inc \| MMS \| Internal CR \| Config \| Settings error | Mariyaiya | Mariyaiya |

**Pass Criteria:**
- ✅ All 4+ test emails create tickets
- ✅ Correct SE assigned per module
- ✅ Correct Developer assigned per module
- ✅ Email notifications sent
- ✅ All ticket fields populated

---

### Test Case 2: Manual Ticket Creation

**Objective:** Test web-based ticket creation

**Role:** Admin or Support Engineer

**Steps:**
1. Login as Support Engineer
2. Click **Create Ticket**
3. Fill form:
   - Customer: Test Customer
   - Module: PPC (select from dropdown)
   - CR Type: Customer CR
   - Issue Type: Bug
   - Description: Manual test ticket
   - Priority: High
4. Click **Create Ticket**

**Expected Result:**
- Success message displayed
- Ticket number generated (2026-XXXXX)
- Auto-assigned to SE: Vignesh, Developer: Annamalai
- Redirected to ticket details page
- Email sent to developer

**Pass Criteria:**
- ✅ Form validation works
- ✅ Module dropdown populated
- ✅ Auto-assignment correct
- ✅ Ticket created successfully
- ✅ Email notification sent

---

### Test Case 3: Ticket Number Format & Year Reset

**Objective:** Verify ticket numbering follows YYYY-00001 format

**Pre-requisites:**
- At least 1 ticket created

**Steps:**
1. Create multiple tickets (5+)
2. Check ticket numbers sequence

**Expected Result:**
- Format: 2026-00001, 2026-00002, 2026-00003...
- Sequential numbering
- Year prefix correct

**Validation Query:**
```bash
# Check ticket counter
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -s -X GET "http://localhost:8001/api/tickets" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; data = json.load(sys.stdin); [print(t['ticket_number']) for t in data[:10]]"
```

**Pass Criteria:**
- ✅ All tickets have YYYY-##### format
- ✅ Numbers sequential
- ✅ No duplicates
- ✅ Year matches current year (2026)

---

### Test Case 4: Status Lifecycle

**Objective:** Verify status flow and completion automation

**Role:** Developer

**Steps:**
1. Login as Developer (e.g., annamalai_dev)
2. Open any ticket assigned to you
3. Change status to **In Progress**
4. Verify status updated
5. Change status to **Completed**
6. Verify completion automation

**Expected Result - Status Change:**
- Status updates immediately
- Audit log created
- Dashboard reflects change

**Expected Result - Completion:**
- Status: Completed
- Completed On: Today's date (auto-filled)
- Completed Time: Current time (auto-filled)
- Completed By: Your name (auto-filled)
- Time Duration: Calculated (e.g., "2 days")
- Ticket locked (cannot edit except remarks)

**Validation:**
```bash
# Check specific ticket
curl -s -X GET "http://localhost:8001/api/tickets/2026-00001" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -m json.tool | grep -A 5 "completed"
```

**Pass Criteria:**
- ✅ Status changes work
- ✅ Flow enforced (no skipping steps)
- ✅ Completion auto-captures date/time/user
- ✅ Duration calculated correctly
- ✅ Completed tickets locked

---

### Test Case 5: Dashboard Analytics

**Objective:** Verify dashboard shows accurate real-time data

**Role:** Any role

**Steps:**
1. Login with any account
2. Navigate to **Dashboard**
3. Review KPI cards
4. Review charts

**Expected Result:**
- **KPI Cards show:**
  - Total Tickets: Count of all tickets
  - Pending: New + Assigned + In Progress + Pending
  - Completed: Count of completed tickets
  - Closed: Count of closed tickets

- **Charts display:**
  - Status Distribution (Pie chart)
  - Issue Type Distribution (Bar chart)
  - CR Type Distribution (Pie chart)
  - Module Wise Pending (Bar chart)
  - Developer Wise Pending (Bar chart)
  - SE Wise Pending (Bar chart)

**Validation:**
```bash
# Get dashboard stats
curl -s -X GET "http://localhost:8001/api/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Manual Check:**
- Count tickets manually
- Compare with dashboard numbers
- Should match exactly

**Pass Criteria:**
- ✅ KPIs accurate
- ✅ All 6 charts rendering
- ✅ Data matches actual tickets
- ✅ Real-time updates (refresh shows changes)

---

### Test Case 6: Filtering & Search

**Objective:** Test ticket filtering capabilities

**Role:** Any role

**Steps:**
1. Go to **Tickets** page
2. Apply filters:
   - Status: Assigned
   - Module: PPC
   - Developer: Annamalai
3. Click **Apply Filters**
4. Verify results

**Test Different Filters:**
- Status only
- Module only
- Customer search (partial match)
- Date range (From/To dates)
- Combination filters

**Expected Result:**
- Only matching tickets shown
- Count updates
- Clear filters resets

**Pass Criteria:**
- ✅ All filters work independently
- ✅ Combination filters work (AND logic)
- ✅ Customer search is case-insensitive
- ✅ Date range filters correctly
- ✅ Clear button resets all

---

### Test Case 7: Role-Based Access Control

**Objective:** Verify proper access restrictions per role

**Test Matrix:**

| Action | Admin | Support | Developer | Manager |
|--------|-------|---------|-----------|---------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Tickets | ✅ | ✅ | ✅ | ✅ |
| Create Ticket | ✅ | ✅ | ❌ | ❌ |
| Edit Ticket | ✅ | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ❌ |
| Edit Completed | ✅ | ❌ | Remarks only | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |

**Steps:**
1. Login as each role
2. Attempt each action
3. Verify access matches table

**Pass Criteria:**
- ✅ All permissions match table
- ✅ Unauthorized actions blocked (403 error)
- ✅ UI hides restricted buttons
- ✅ Direct API calls also blocked

---

### Test Case 8: User Management (Admin Only)

**Objective:** Test user creation, deletion, password management

**Role:** Admin only

**Steps:**
1. Login as Admin
2. Go to **Users**
3. Create new user
4. Login as new user (verify works)
5. Delete user (Admin)
6. Try login again (should fail)

**Test Password Change:**
```bash
# User changes own password (API test)
curl -X PUT http://localhost:8001/api/users/change-password \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"old","new_password":"new"}'
```

**Pass Criteria:**
- ✅ User creation works
- ✅ New user can login
- ✅ User deletion works
- ✅ Deleted user cannot login
- ✅ Cannot delete own admin account
- ✅ Password change works

---

### Test Case 9: Email Format Validation

**Objective:** Verify invalid email formats are rejected/logged

**Steps:**
1. Send email with invalid subject:
   - Missing fields: `Customer | Module`
   - Wrong separator: `Customer - Module - Type`
   - No separator: `Customer Module Type Issue`

**Expected Result:**
- Email listener logs error
- Ticket NOT created
- Email marked as read (processed)

**Validation:**
```bash
sudo supervisorctl tail -50 email_listener | grep -i "invalid"
```

**Pass Criteria:**
- ✅ Invalid formats logged
- ✅ No ticket created
- ✅ Clear error message in log
- ✅ Valid format example shown in log

---

### Test Case 10: Concurrent Operations

**Objective:** Test system under multiple simultaneous operations

**Steps:**
1. Multiple users login simultaneously
2. Create tickets at same time (different browsers)
3. Update same ticket from different sessions
4. Verify data consistency

**Expected Result:**
- No ticket number collisions
- All tickets created successfully
- Last update wins (optimistic locking)
- No data corruption

**Pass Criteria:**
- ✅ Unique ticket numbers
- ✅ No race conditions
- ✅ Data remains consistent
- ✅ All operations complete

---

## 📊 UAT Test Results Template

### Test Summary

| Test Case | Status | Notes | Issues Found |
|-----------|--------|-------|--------------|
| TC1: Email-to-Ticket | ⬜ Pass / ❌ Fail | | |
| TC2: Manual Creation | ⬜ Pass / ❌ Fail | | |
| TC3: Ticket Numbering | ⬜ Pass / ❌ Fail | | |
| TC4: Status Lifecycle | ⬜ Pass / ❌ Fail | | |
| TC5: Dashboard | ⬜ Pass / ❌ Fail | | |
| TC6: Filtering | ⬜ Pass / ❌ Fail | | |
| TC7: Role Access | ⬜ Pass / ❌ Fail | | |
| TC8: User Management | ⬜ Pass / ❌ Fail | | |
| TC9: Email Validation | ⬜ Pass / ❌ Fail | | |
| TC10: Concurrent Ops | ⬜ Pass / ❌ Fail | | |

### Issues Log

| Issue # | Test Case | Severity | Description | Status |
|---------|-----------|----------|-------------|--------|
| 1 | | Critical/High/Medium/Low | | Open/Fixed |

### Overall Assessment

**Total Tests:** 10  
**Passed:** _____  
**Failed:** _____  
**Pass Rate:** _____%

**UAT Verdict:**
- ⬜ **Approved for Phase-2 Migration**
- ⬜ **Approved with Minor Issues** (list issues)
- ⬜ **Not Approved** (critical issues found)

---

## 🐛 Issue Reporting Format

When reporting issues during UAT:

```
Issue #: [Sequential number]
Test Case: [Which test case]
Severity: [Critical/High/Medium/Low]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots/Logs:
[Attach if available]

Environment:
- Browser: [Chrome/Firefox/etc]
- User Role: [Admin/Support/Developer/Manager]
- Ticket ID: [If applicable]
```

---

## ✅ UAT Sign-Off

**Performed By:**  
Name: _____________________  
Role: _____________________  
Date: _____________________

**Approval:**
- ⬜ System approved for business use
- ⬜ All critical issues resolved
- ⬜ Documentation complete
- ⬜ Training completed

**Signatures:**
- UAT Lead: _____________________ Date: _____
- Project Manager: _____________________ Date: _____
- Technical Lead: _____________________ Date: _____

---

## 📞 UAT Support

**During UAT, contact:**
- Technical Issues: Check logs first (`sudo supervisorctl tail <service>`)
- Functional Questions: Refer to README.md or QUICK_REFERENCE.md
- Security Concerns: Refer to SECURITY.md

**Logs Location:**
```bash
# Backend API logs
/var/log/supervisor/backend.err.log

# Email listener logs
/var/log/supervisor/email_listener.out.log

# Frontend logs
/var/log/supervisor/frontend.err.log
```

---

## 📋 Post-UAT Actions

After successful UAT:

1. **Document Findings**
   - Compile all test results
   - Document any workarounds
   - List enhancement requests

2. **Prepare for Phase-2**
   - Export database schema
   - Document API contracts
   - Create ASP.NET migration plan

3. **Handover**
   - Train end users
   - Configure email credentials (production)
   - Set up database backups

---

**UAT Guide Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** ✅ Ready for UAT