# Security & Authentication - Updated Guide

## ✅ Security Fixes Implemented

### Changes Made (2026-01-08)

**CRITICAL SECURITY UPDATES:**
1. ✅ **Removed default credentials from UI** - No longer displayed on login page
2. ✅ **Implemented Admin User Management** - Secure user creation workflow
3. ✅ **Password hashing enforced** - All passwords bcrypt hashed
4. ✅ **Role-based user creation** - Admin controls all user accounts
5. ✅ **Password change functionality** - Users can update their own passwords
6. ✅ **Password reset capability** - Admin can reset user passwords

---

## 🔐 Initial System Setup

### Step 1: First Admin Login

**IMPORTANT: This is the ONLY time you'll use default credentials**

1. Access: http://localhost:3000
2. Login with initial admin account:
   - Username: `admin`
   - Password: `admin123`

### Step 2: Create Your Real Admin Account

1. Navigate to **Users** (in top navigation)
2. Click **Create New User**
3. Fill in:
   - Username: Your preferred admin username (e.g., `admin_yourname`)
   - Full Name: Your full name
   - Password: Strong password (min 6 characters)
   - Role: **Admin**
4. Click **Create User**

### Step 3: Logout and Test New Account

1. Logout from default admin
2. Login with your new admin credentials
3. Verify access to all admin functions

### Step 4: Create Team Accounts

Create accounts for your team members:

**Support Engineers:**
```
Example users to create:
- Username: seenivasan_support
- Full Name: Seenivasan
- Role: Support Engineer
- Password: (Set secure password)
```

**Developers:**
```
Example users to create:
- Username: annamalai_dev
- Full Name: Annamalai
- Role: Developer
- Password: (Set secure password)
```

**Managers:**
```
Example users to create:
- Username: manager_name
- Full Name: Manager Full Name
- Role: Manager
- Password: (Set secure password)
```

### Step 5: Delete Default Accounts (Optional but Recommended)

Once all real accounts are created:
1. Go to **Users** page
2. Delete old default accounts:
   - Delete: admin (original)
   - Delete: seenivasan, vignesh, palanivel, muthuvel (default SEs)
   - Delete: annamalai, sasi, mariya, mohan, udhay (default devs)
   - Delete: manager (default)

**⚠️ WARNING:** Make sure you have at least one working Admin account before deleting the default admin!

---

## 👥 User Management (Admin Only)

### Creating New Users

**Admin → Users → Create New User**

**Required Fields:**
- **Username**: Unique identifier (no spaces, lowercase recommended)
- **Full Name**: Display name for the user
- **Password**: Initial password (user should change after first login)
- **Role**: One of:
  - Admin (full access)
  - Support Engineer (create/edit tickets, update status)
  - Developer (edit tickets, update status)
  - Manager (read-only)

**Example:**
```
Username: john_developer
Full Name: John Smith
Password: TempPass123!
Role: Developer
```

### Deleting Users

1. Go to **Users** page
2. Find user in the list
3. Click **Delete** button
4. Confirm deletion

**Notes:**
- Cannot delete your own account
- Deletion is permanent
- User's tickets remain in system

### Resetting User Passwords

**Via API (Admin only):**
```bash
curl -X PUT http://localhost:8001/api/users/{username}/reset-password \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "new_password=NewSecurePass123"
```

---

## 🔑 Password Management

### Users Changing Their Own Password

**Future Enhancement:** Add UI for password change

**Current Method (API):**
```bash
curl -X PUT http://localhost:8001/api/users/change-password \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123",
    "new_password": "NewPassword456"
  }'
```

### Password Requirements

**Current:**
- Minimum 6 characters
- No complexity requirements (yet)

**Recommended for Production:**
- Minimum 8 characters
- Include uppercase, lowercase, number, special character
- Not previously used password
- Regular password rotation policy

---

## 🛡️ Security Features

### Implemented

✅ **Password Hashing**
- All passwords stored as bcrypt hashes
- Cannot be reversed or decrypted
- Salt included automatically

✅ **JWT Authentication**
- Secure token-based auth
- Tokens expire after 24 hours
- Re-login required after expiration

✅ **Role-Based Access Control (RBAC)**
- Every API endpoint checks user role
- UI elements hidden based on role
- Cannot bypass via direct API calls

✅ **User Isolation**
- Users can only change their own password
- Admin required for user management
- Audit logs track who made changes

### Authentication Flow

```
1. User enters username/password
   ↓
2. Backend verifies against hashed password
   ↓
3. JWT token generated (24hr expiry)
   ↓
4. Token stored in browser localStorage
   ↓
5. All API requests include token in header
   ↓
6. Backend validates token on every request
   ↓
7. User role checked for authorization
```

---

## 📊 User Management Dashboard

### Admin View

When logged in as Admin, you see:

**Users Tab:**
- Total user count
- List of all users with:
  - Username
  - Full Name
  - Role (color-coded)
  - Created Date
  - Delete button

**Features:**
- Create new user button
- Delete users (except self)
- View all user information
- Search/filter users (coming soon)

### Role Indicators

- 🔴 **Admin** (Red badge)
- 🔵 **Support Engineer** (Blue badge)
- 🟢 **Developer** (Green badge)
- ⚫ **Manager** (Gray badge)

---

## 🔒 Best Practices

### For Administrators

1. ✅ **Change default admin password immediately**
2. ✅ **Create individual accounts for each user**
3. ✅ **Use strong, unique passwords**
4. ✅ **Delete default accounts after migration**
5. ✅ **Regular user access reviews**
6. ✅ **Remove accounts when employees leave**
7. ✅ **Use descriptive usernames (e.g., firstname_lastname)**

### For All Users

1. ✅ **Change password after first login**
2. ✅ **Use strong, unique passwords**
3. ✅ **Never share login credentials**
4. ✅ **Logout when done using system**
5. ✅ **Report suspicious activity immediately**

### Password Guidelines

**Strong Password Examples:**
```
✅ T1ck3t!Sy$t3m2026
✅ ErP#S3cur3@2026
✅ MyP@ssw0rd!2026

❌ password
❌ 123456
❌ admin123 (default - must change!)
```

---

## 📝 API Reference

### User Management Endpoints

**Create User (Admin only)**
```
POST /api/users
Authorization: Bearer {admin_token}
Body: {
  "username": "string",
  "password": "string",
  "full_name": "string",
  "role": "Admin|Support Engineer|Developer|Manager"
}
```

**List Users (Admin only)**
```
GET /api/users
Authorization: Bearer {admin_token}
```

**Delete User (Admin only)**
```
DELETE /api/users/{username}
Authorization: Bearer {admin_token}
```

**Change Own Password**
```
PUT /api/users/change-password
Authorization: Bearer {user_token}
Body: {
  "current_password": "string",
  "new_password": "string"
}
```

**Reset User Password (Admin only)**
```
PUT /api/users/{username}/reset-password
Authorization: Bearer {admin_token}
Body: new_password=string
```

---

## ✅ Security Checklist

### Initial Setup
- [ ] Login with default admin
- [ ] Create new admin account
- [ ] Test new admin login
- [ ] Create all team user accounts
- [ ] Communicate credentials securely (not via email!)
- [ ] Delete default admin account
- [ ] Delete all other default accounts

### Ongoing
- [ ] Users change passwords after first login
- [ ] Regular password updates (every 90 days)
- [ ] Remove inactive user accounts
- [ ] Review user roles quarterly
- [ ] Monitor audit logs for suspicious activity

---

## 🚨 Troubleshooting

### Can't Login

**Problem:** Invalid username or password

**Solution:**
1. Verify username (case-sensitive)
2. Verify password (case-sensitive)
3. Contact admin for password reset

### Forgot Password

**Solution:**
1. Contact system administrator
2. Admin resets password via Users page
3. Login with new password
4. Change password immediately

### User Creation Fails

**Error:** "Username already exists"
**Solution:** Choose different username

**Error:** "Only admins can create users"
**Solution:** Must be logged in as Admin role

### Can't Delete User

**Error:** "Cannot delete your own account"
**Solution:** Have another admin delete your account

---

## 📞 Support

For authentication issues:
- Contact system administrator
- Check user management documentation
- Verify API tokens haven't expired (24hr limit)

---

**Last Updated:** 2026-01-08 (Post Security Fix)
**Status:** ✅ Production Ready with Secure Authentication