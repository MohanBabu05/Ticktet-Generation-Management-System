# Quick Reference Guide - ERP Ticketing System

## 🚀 Quick Start

### Access the System
**URL:** http://localhost:3000

### Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Support Engineer | seenivasan | support123 |
| Developer | annamalai | dev123 |
| Manager | manager | manager123 |

---

## 📧 Email to Ticket - Quick Guide

### Email Subject Format (MANDATORY)
```
Customer | Module | CRType | Issue Type | Description
```

### Examples

✅ **Correct:**
```
Sky Cotex | PPC | Customer CR | Operational Issue | Rate Master Issue
ABC Mills | Payroll | Internal CR | Bug | Salary calculation wrong
XYZ Textiles | MIS | Customer CR | Enhancement | New report needed
```

❌ **Wrong:**
```
Sky Cotex - PPC - Rate Master Issue          (using dashes)
Sky Cotex, PPC, Bug                          (missing fields)
Rate Master Issue                            (no customer/module)
```

### Send Email To
**Address:** erpkalsofte@gmail.com

**What Happens:**
1. Email received (checked every 60 seconds)
2. Subject parsed automatically
3. Ticket created with number (e.g., 2026-00001)
4. Support Engineer auto-assigned based on module
5. Developer auto-assigned based on module
6. Email sent to developer with CC to development@kalsofte.com
7. Status set to "Assigned"

---

## 🎯 Module → Assignment Reference

### Support Engineers

| Modules | Assigned To |
|---------|-------------|
| PO, Invy, RMI, Import, Sales (all variants) | Seenivasan |
| Paper RMI | Muthuvel |
| PPC, Production (all variants), QC | Vignesh |
| MMS, EMS, Power | Mariyaiya |
| Payroll, HR, Finance (FA, FAD), Costing, MIS | Palanivel |

### Developers

| Modules | Assigned To |
|---------|-------------|
| PO, Invy, RMI, MMS, EMS, Canteen | Mariyaiya |
| PPC, Production, Sales (most), FGI | Annamalai |
| Import, Payroll, HR, Finance, System Admin | Sasi |
| HT Prodn, HT Sales, MIS, PPS | Mariya |
| Approvals, Web Reports, Automail, CSM | Mohan Babu |
| All Modules Report | Udhay |

---

## 📱 Using the Web Interface

### Dashboard
- View total tickets, pending, completed, closed
- See charts: Status, Issue Type, CR Type, Module Pending
- Developer-wise and SE-wise pending counts
- Click "Refresh" to update data

### View Tickets
- See all tickets in table format
- Use filters to narrow down:
  - Status (New, Assigned, In Progress, Completed, Closed, Pending)
  - Module, Developer, Support Engineer
  - Customer search
  - Date range
- Click "View" to see ticket details

### Create Ticket (Admin & Support only)
1. Click "Create Ticket" in navigation
2. Fill required fields:
   - Customer (required)
   - Module (required - select from dropdown)
   - CR Type (Customer CR / Internal CR)
   - Issue Type (required)
   - Description (required)
3. Optional fields: Priority, AMC Cost, PR Approval, Dates, Remarks
4. Click "Create Ticket"
5. System auto-assigns SE and Developer
6. Email sent automatically

### Update Ticket Status
1. Open ticket details
2. Scroll to "Update Status" section
3. Select new status
4. Click "Update Status"

**Status Flow:**
```
New → Assigned → In Progress → Completed → Closed
         ↓
      Pending (if blocked)
```

### Edit Ticket
1. Open ticket details
2. Click "Edit Ticket" button
3. Modify fields
4. Click "Save Changes"

**Note:** Completed tickets are locked (only remarks editable)

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| New | Blue | Just created |
| Assigned | Yellow | Assigned to developer |
| In Progress | Purple | Developer working on it |
| Pending | Orange | Blocked/waiting |
| Completed | Green | Work finished |
| Closed | Gray | Archived |

---

## ⚡ Keyboard Shortcuts

- **F5** - Refresh page
- **Ctrl+F** - Search within page
- **Esc** - Close modals

---

## 📊 Priority Levels

| Priority | When to Use |
|----------|-------------|
| Low | Minor issues, cosmetic fixes |
| Medium | Normal operations (default) |
| High | Critical business impact, blocking work |

---

## 🔢 Ticket Number Format

**Format:** YYYY-NNNNN

**Examples:**
- 2026-00001 (first ticket of 2026)
- 2026-00002 (second ticket)
- 2027-00001 (first ticket of 2027 - resets)

**Auto-increments:** Yes, automatically

---

## 👥 Role Capabilities

### Admin
- ✅ Everything (full access)
- Can edit completed tickets
- Can manage users (via API)

### Support Engineer
- ✅ Create tickets
- ✅ Edit tickets (except completed)
- ✅ Update status
- ✅ View dashboard
- ❌ Cannot edit completed tickets

### Developer
- ✅ Edit tickets (except completed)
- ✅ Update status
- ✅ View dashboard
- ❌ Cannot create tickets
- ❌ Cannot edit completed tickets (except remarks)

### Manager
- ✅ View dashboard
- ✅ View all tickets
- ❌ Cannot create tickets
- ❌ Cannot edit tickets
- ❌ Cannot update status
- Read-only access

---

## 🕒 Timeline

### Ticket Lifecycle Example
```
Day 1, 10:00 AM - Email received
Day 1, 10:01 AM - Ticket created (2026-00001)
Day 1, 10:01 AM - Auto-assigned to Developer
Day 1, 10:01 AM - Email sent to Developer
Day 1, 02:00 PM - Developer marks "In Progress"
Day 2, 11:00 AM - Developer marks "Completed"
Day 2, 11:00 AM - System auto-captures:
                  - Completed date: Day 2
                  - Completed time: 11:00 AM
                  - Completed by: Developer name
                  - Duration: 1 day
```

---

## 🔔 Email Notifications

### Who Gets Notified?
- **Assigned Developer** (To:)
- **Development Team** (CC: development@kalsofte.com)

### When?
- Immediately when ticket is created (manual or email)

### Email Contains:
- Ticket Number
- Customer Name
- Module
- Original Subject/Description
- Full email body (if from email)

---

## 💡 Tips & Tricks

### For Support Engineers
- Use consistent customer names (avoid typos)
- Set priority correctly (helps developers prioritize)
- Add remarks for context
- Update commitment dates when promised to customer

### For Developers
- Update status regularly (keeps everyone informed)
- Use "Pending" if blocked (shows it's not forgotten)
- Add completion remarks (helps future reference)
- Fill "Reason for Issue" (improves quality)

### For Email Senders
- **Always use pipe (|) separator**
- **All 5 fields required** (Customer, Module, CRType, IssueType, Description)
- Check module name spelling (case-sensitive)
- Keep descriptions concise in subject
- Add details in email body

---

## 📞 Quick Help

### Ticket Not Created from Email?
1. Check subject format (5 parts with | separator)
2. Verify module name matches list
3. Check email listener logs
4. Wait 60 seconds (system checks every minute)

### Can't Login?
1. Verify username/password (case-sensitive)
2. Check with admin if account exists
3. Try default credentials from this guide

### Auto-assignment Not Working?
1. Module name must match exactly
2. Check reference table above
3. Some modules may show "Unassigned" if not in mapping

### Dashboard Not Loading?
1. Refresh page (F5)
2. Check if backend is running
3. Try logging out and back in

---

## 📝 Common CR Types

| Type | When to Use |
|------|-------------|
| Customer CR | Customer requested change/fix |
| Internal CR | Internal improvement/optimization |

---

## 📈 Common Issue Types

- Operational Issue
- Bug
- Enhancement
- Data Issue
- Performance Issue
- Security Issue
- Configuration Issue

---

## ✅ Best Practices

1. **Email Format:** Always double-check before sending
2. **Status Updates:** Update regularly (keeps dashboard accurate)
3. **Descriptions:** Be clear and specific
4. **Priority:** Use correctly (don't mark everything High)
5. **Completion:** Mark complete only when fully done
6. **Remarks:** Add useful notes for team reference

---

**Need More Help?**
- Read full README.md for detailed documentation
- Check DEPLOYMENT.md for technical details
- Review logs for specific issues

**Last Updated:** 2026-01-08