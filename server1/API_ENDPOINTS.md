# API Endpoints Reference

## Authentication Endpoints

### User Authentication

#### Create User
```http
POST /user/create
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword",          // Optional (required if pwdLogin=true)
  "pwdLogin": true,                    // Optional, default: false
  "googleOauth": true,                 // Optional, default: false
  "googleEmail": "user@gmail.com",     // Optional (required if googleOauth=true)
  "firstName": "John",
  "lastName": "Doe",
  "accountStatus": "active"            // Optional, default: "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "pwdLogin": true,
    "googleOauth": true,
    "googleEmail": "user@gmail.com",
    "accountStatus": "active"
  }
}
```

**Errors:**
- `400`: Missing required fields (email, firstName, lastName)
- `400`: Password required when pwdLogin is enabled
- `400`: Google email required when googleOauth is enabled
- `409`: User with this email already exists
- `409`: Google email already associated with another user

---

#### Login with Email/Password
```http
POST /user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errors:**
- `400`: Email and password required
- `401`: Invalid email or password
- `403`: Password login not enabled / Account not active

---

#### Get Current User Info
```http
GET /user/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "active",
    "pwdLogin": true,
    "googleOauth": true,
    "googleEmail": "john@gmail.com"
  }
}
```

---

#### Logout
```http
POST /user/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Google OAuth

#### Initiate Google OAuth Flow
```http
GET /oauth/google
```
Redirects to Google OAuth consent screen.

---

#### OAuth Callback (automatic)
```http
GET /oauth/google/callback?code=...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "googleEmail": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "photoUrl": "https://..."
  }
}
```

**Errors:**
- Redirects to `/oauth/login/failed` on authentication failure
- Returns `401`: No account found / Google OAuth not enabled / Account not active

---

### Admin Authentication

#### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

#### Test Admin Authentication
```http
GET /admin/test
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin authentication successful",
  "user": {
    "email": "admin@example.com",
    "role": "admin",
    "isAdmin": true
  }
}
```

---

## Public ReachMe Endpoints

### Create Public ReachMe Page
```http
POST /public-reachme/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "deactivateAt": "2025-12-31T23:59:59Z"  // null for never expire
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "urlCode": "b3k",
  "fullUrl": "https://reachme2.com:8052/r/b3k/",
  "message": "Public ReachMe URL created successfully"
}
```

---

### List User's Public Pages
```http
GET /public-reachme/list
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "urls": [
    {
      "id": 1,
      "urlCode": "b3k",
      "fullUrl": "https://reachme2.com:8052/r/b3k/",
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00Z",
      "deactivateAt": null
    }
  ]
}
```

---

### Deactivate Public Page
```http
POST /public-reachme/deactivate/:urlCode
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Public ReachMe URL deactivated"
}
```

---

### Update Deactivation Time
```http
PUT /public-reachme/update-deactivate/:urlCode
Authorization: Bearer <token>
Content-Type: application/json

{
  "deactivateAt": "2025-12-31T23:59:59Z"  // null for never expire
}
```

---

### Access Public Page (GET)
```http
GET /r/:urlCode/
```

Returns HTML form for contact submission.

---

### Submit Message (POST)
```http
POST /r/:urlCode/
Content-Type: application/json

{
  "message": "Hello, I'd like to reach you!",
  "senderInfo": {
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Test Mode (doesn't create alarm):**
```http
POST /r/:urlCode/?test=true
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
  "status": "test",
  "userId": "user@example.com"
}
```

---

## Token Format

All endpoints return JWT tokens with the following structure:

**User Token:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "exp": 1700000000
}
```

**Admin Token:**
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "isAdmin": true,
  "exp": 1700000000
}
```

**Google OAuth Token (includes both emails):**
```json
{
  "userId": 123,
  "email": "user@example.com",           // Primary email
  "googleEmail": "user@gmail.com",       // Google OAuth email
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "exp": 1700000000
}
```

---

## Authentication Header

Include JWT token in requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or token is automatically sent via HTTP-only cookie (`authToken`).

---

## Error Responses

Standard error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
