# ReachMe Backend Server

Express.js backend server with SSL/HTTPS support and Google OAuth integration.

## Features

- ✅ HTTPS/SSL support with local certificates
- ✅ Google OAuth authentication
- ✅ Environment-based configuration (dev/prod)
- ✅ JWT token-based authentication
- ✅ CORS enabled
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Session management
- ✅ API endpoints for ReachMe client

## Quick Start

### 1. Install Dependencies

```bash
cd /home/ubuntu/code/reachme/server1
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Google OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Session and JWT secrets
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret-key

# For development
NODE_ENV=development

# For production
# NODE_ENV=production
```

### 3. Configure Google OAuth

#### Local Development Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://reachme2.com:8052/oauth/google/callback`

#### Production Setup (Remote Server)

1. Add authorized redirect URI: `https://b.c.sel2in.com:8088/oauth/google/callback`

### 4. Add Local Domain to /etc/hosts

For development, add these entries to `/etc/hosts`:

```bash
127.0.0.1 reachme.com
127.0.0.1 reachme2.com
127.0.0.1 a.reachme2.com
127.0.0.1 b.c.sel2in.com
```

### 5. Run the Server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server will start on:
- **Local Development:** `https://reachme2.com:8052`
- **Production:** `https://b.c.sel2in.com:8088`

## API Endpoints

### Public Endpoints

#### Health Check
```
GET /health
```

Returns server status and configuration.

#### User Check
```
POST /api/user/check
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Returns whether user is allowed to login.

#### Google OAuth
```
GET /oauth/google
```

Initiates Google OAuth flow.

```
GET /oauth/google/callback
```

OAuth callback endpoint (automatically called by Google).

### Protected Endpoints (Require JWT Token)

#### Poll for Commands
```
GET /reachme/check?deviceId={deviceId}
Authorization: Bearer {token}
```

Returns pending commands for device.

#### Download File
```
GET /getFile?id={fileId}
Authorization: Bearer {token}
```

Download audio file by ID.

#### Create Command
```
POST /api/command
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device123",
  "type": "alert",
  "title": "Test Alert",
  "msg": "This is a test"
}
```

Create a new command for a device.

#### Get User Profile
```
GET /api/user/profile
Authorization: Bearer {token}
```

Get current user's profile.

#### Register Device
```
POST /api/device/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device123",
  "platform": "android",
  "deviceName": "My Phone"
}
```

Register a new device.

## SSL Certificates

The server uses SSL certificates from `./cert/` directory:
- Certificate: `rentpay.com+3.pem`
- Private Key: `rentpay.com+3-key.pem`

For production, replace these with your actual SSL certificates.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port (dev) | `8052` |
| `PROD_PORT` | Server port (prod) | `8088` |
| `DEV_BASE_URL` | Base URL for local dev | `https://reachme2.com` |
| `PROD_BASE_URL` | Base URL for remote prod | `https://b.c.sel2in.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Required |
| `SESSION_SECRET` | Session encryption key | Required |
| `JWT_SECRET` | JWT signing key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:8080` |
| `SSL_CERT_PATH` | SSL certificate path | `./cert/rentpay.com+3.pem` |
| `SSL_KEY_PATH` | SSL private key path | `./cert/rentpay.com+3-key.pem` |

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Protects against brute force attacks
- **CORS**: Configurable cross-origin requests
- **JWT**: Stateless authentication
- **HTTPS**: Encrypted connections
- **HTTP-Only Cookies**: Protected session cookies

## Project Structure

```
server1/
├── cert/                    # SSL certificates
│   ├── rentpay.com+3.pem
│   └── rentpay.com+3-key.pem
├── routes/
│   ├── auth.js             # OAuth routes
│   └── api.js              # API routes
├── server.js               # Main server file
├── package.json
├── .env.example
└── README.md
```

## Development Workflow

1. Make changes to code
2. Server auto-reloads (using nodemon)
3. Test endpoints with:
   ```bash
   curl -k https://reachme2.com:8052/health
   ```

## Testing OAuth Flow

1. Navigate to: `https://reachme2.com:8052/oauth/google`
2. Complete Google sign-in
3. Receive JWT token in response
4. Use token in subsequent API calls:
   ```bash
   curl -k https://reachme2.com:8052/api/user/profile \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `GOOGLE_CLIENT_ID` with production credentials
3. Add production redirect URI to Google Console: `https://b.c.sel2in.com:8088/oauth/google/callback`
4. Replace SSL certificates with production certificates
5. Configure firewall to allow port 8088
6. Use process manager (PM2, systemd) to keep server running

## TODO

- [ ] Implement database integration (MariaDB)
- [ ] Add user management endpoints
- [ ] Implement command queue system
- [ ] Add file upload/download functionality
- [ ] Implement WebSocket support for real-time updates
- [ ] Add comprehensive error logging
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Add unit and integration tests
- [ ] Implement database migrations
- [ ] Add monitoring and health checks

## Support

For issues or questions, refer to the main project documentation.
