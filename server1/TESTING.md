# Test Scripts Guide

## Overview

This guide explains how to set up and run the comprehensive test suite for the ReachMe backend.

## Files

- **`db/schema_full.sql`** - Full database schema (drops and recreates all tables)
- **`scripts/reset-db.sh`** - Shell script to reset the database
- **`src/test/user1_withDb_tests.js`** - Comprehensive user and API tests
- **`src/test/user_auth_tests.js`** - User authentication tests (password + OAuth)

## Setup Steps

### 1. Reset Database (CAUTION: Drops all tables!)

```bash
# Make script executable
chmod +x scripts/reset-db.sh

# Run the reset script
# This will DROP all tables and recreate them
./scripts/reset-db.sh
```

**Or manually:**

```bash
# Using environment variable
export env=local

# Source environment file
source .local.env

# Execute SQL
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PWD" "$DB_NAME" < db/schema_full.sql
```

### 2. Start the Server

```bash
# In a separate terminal
export env=local
npm run dev
```

The server should start at `https://reachme2.com:8052`

### 3. Run Tests

**Option A: Full User & API Tests**
```bash
node src/test/user1_withDb_tests.js
```

**Option B: User Authentication Tests Only**
```bash
# Requires test user to exist (run Option A first)
node src/test/user_auth_tests.js
```

## What the Tests Do

The test script performs the following operations:

1. **Database Cleanup**
   - Deletes any existing test user (`test1@test.local`)
   - Cleans up related records (messages, public pages, invites)

2. **Admin Setup**
   - Configures admin user with encrypted credentials
   - Tests admin login
   - Verifies admin authentication

3. **User Creation**
   - Creates test user with:
     - Email: `test1@test.local`
     - Password: `ds2#fk_3S3Vf_s` (hashed with bcrypt)
     - Can login with password: Yes
     - Google OAuth ID: `google_oauth_id_12345`
     - Google Email: `test1.google@gmail.com`

4. **Public ReachMe Page**
   - Creates a public "reach me" page for the test user
   - Generates random URL code (e.g., `b3k`, `r-7!`, etc.)
   - URL format: `/r/<code>/`

5. **Test Mode**
   - Tests the public page with `?test=true` parameter
   - Verifies it returns user email without creating an alarm
   - Response: `{"status": "test", "userId": "test1@test.local"}`

6. **Real Message**
   - Sends an actual message through the public page
   - Verifies message is stored in database
   - Checks response: `{"status": "ok"}`

7. **Keep Data**
   - Test data is **kept** in the database for inspection
   - Does not clean up at the end

## Test User Details

After running the tests, you'll have:

- **Primary Email (User ID):** `test1@test.com`
- **Password:** `ds2#fk_3S3Vf_s` (encrypted with AES-256)
- **Login Methods:**
  - Password authentication: ✅ Enabled (`pwdLogin = true`)
  - Google OAuth: ✅ Enabled (`googleOauth = true`)
- **Google Details:**
  - Google Email: `test1.different@gmail.com` (different from primary email)

## Database Schema Updates

The updated schema includes:

### Users Table
```sql
- email VARCHAR(255) NOT NULL UNIQUE 
  -- Primary email / User ID for email/password login
  
- password_hash VARCHAR(255) NULL
  -- Encrypted password using AES-256 (same encryption as admin passwords)
  
- pwdLogin BOOLEAN DEFAULT FALSE
  -- If TRUE, user can login with email + password
  -- Search by 'email' column when authenticating
  
- googleOauth BOOLEAN DEFAULT FALSE
  -- If TRUE, user can login via Google OAuth
  
- USER_GOOGLE_EMAIL VARCHAR(255) NULL UNIQUE
  -- Email from Google OAuth (can be different from primary email)
  -- Search by this column on Google OAuth callback
```

**Login Logic:**
1. **Email/Password Login**: 
   - Check `pwdLogin = TRUE`
   - Search by `email` column
   - Decrypt and verify `password_hash`

2. **Google OAuth Login**:
   - Check `googleOauth = TRUE`
   - Search by `USER_GOOGLE_EMAIL` column
   - Return first matching user (assumed unique)

**Example Scenarios:**
- User with `email = "john@company.com"`, `USER_GOOGLE_EMAIL = "john@gmail.com"`
  - Can login with john@company.com + password
  - Can login via Google with john@gmail.com account
  
- User with `email = "sarah@gmail.com"`, `USER_GOOGLE_EMAIL = "sarah@gmail.com"`
  - Primary email and Google email are the same
  - Can use both login methods with same email

## Expected Output

```
🚀 Starting User Tests with Database

Server: https://reachme2.com:8052
Database: 127.0.0.1:3306/reachm1
DB User: g8
✅ Database connection established

🧹 Cleaning up test user...
✅ Deleted test user: test1@test.local

🔐 Setting up admin user...
✅ Admin user configured: t1gkl

🔑 Testing admin login...
✅ Admin login successful

🔒 Testing admin authentication...
✅ Admin authentication successful

👤 Creating test user...
✅ Created test user: test1@test.com
   User ID: 123
   Password Login: Yes
   Google OAuth: Yes
   Google Email: test1.different@gmail.com

📄 Creating public ReachMe page...
✅ Created public ReachMe page
   URL Code: b3k
   Full URL: https://reachme2.com:8052/r/b3k/

🧪 Testing public ReachMe page...
✅ Public ReachMe page test successful
   User ID returned: test1@test.com

📨 Testing message submission...
✅ Message sent successfully
   Message found in database:
   - Message: Test message from automated test
   - Sender: Automated Test

==================================================
📊 Test Summary
==================================================
User Email: test1@test.com
User ID: 123
Public ReachMe Code: b3k
Public ReachMe URL: https://reachme2.com:8052/r/b3k/
==================================================

✅ All tests passed!

ℹ️  Test data has been kept in the database for inspection.
```

## Troubleshooting

### Server not running
```
Error: connect ECONNREFUSED
```
**Solution:** Start the server with `npm run dev`

### Database connection failed
```
Error: Access denied for user
```
**Solution:** Check `.local.env` has correct DB credentials

### Admin login failed
```
Admin login failed
```
**Solution:** Make sure `src/.admin.users` file exists with admin credentials

### bcryptjs not found
```
Cannot find module 'bcryptjs'
```
**Solution:** Run `npm install bcryptjs`

## Cleanup (Optional)

To remove test data manually:

```sql
DELETE FROM reach_me_messages WHERE user_id = (SELECT id FROM users WHERE email = 'test1@test.com');
DELETE FROM pblcRechms WHERE user_id = (SELECT id FROM users WHERE email = 'test1@test.com');
DELETE FROM users WHERE email = 'test1@test.com';
```

## User Authentication Endpoints

### Available Endpoints

**1. User Login (Email/Password)**
```bash
POST /user/login
Content-Type: application/json

{
  "email": "test1@test.com",
  "password": "ds2#fk_3S3Vf_s"
}

# Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "test1@test.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

**2. Google OAuth Login**
```bash
# Initiate OAuth flow
GET /oauth/google

# Callback (handled automatically)
GET /oauth/google/callback

# Response (200):
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "test1@test.com",           # Primary email
    "googleEmail": "test1.different@gmail.com",  # Google OAuth email
    "firstName": "Test",
    "lastName": "User",
    "photoUrl": "https://..."
  }
}
```

**3. Get Current User Info**
```bash
GET /user/me
Authorization: Bearer <token>

# Response (200):
{
  "success": true,
  "user": {
    "id": 123,
    "email": "test1@test.com",
    "firstName": "Test",
    "lastName": "User",
    "accountStatus": "active",
    "pwdLogin": true,
    "googleOauth": true,
    "googleEmail": "test1.different@gmail.com"
  }
}
```

**4. Logout**
```bash
POST /user/logout
Authorization: Bearer <token>

# Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Authentication Logic

**Email/Password Login** (`POST /user/login`):
1. Search users table by `email` column
2. Check `pwdLogin = TRUE`
3. Check `account_status = 'active'`
4. Decrypt `password_hash` using AES-256
5. Compare with provided password
6. Return JWT with primary email

**Google OAuth Login** (`/oauth/google/callback`):
1. Receive Google profile with email
2. Search users table by `USER_GOOGLE_EMAIL` column
3. Check `googleOauth = TRUE`
4. Check `account_status = 'active'`
5. Return JWT with primary email (NOT Google email)

**Key Points:**
- User can have both login methods enabled
- Primary `email` is the user ID (used in JWT)
- `USER_GOOGLE_EMAIL` can differ from primary email
- Both use same JWT format for session management
