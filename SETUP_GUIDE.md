# ReachMe - Complete Setup Guide

This guide covers both the backend server and React Native client setup.

## Prerequisites

1. **Add to /etc/hosts** (for local development):
   ```bash
   sudo nano /etc/hosts
   ```
   Add these lines:
   ```
   127.0.0.1 reachme.com
   127.0.0.1 reachme2.com
   127.0.0.1 a.reachme2.com
   127.0.0.1 b.c.sel2in.com
   ```

2. **Node.js 20.18.0** (using nvm):
   ```bash
   nvm install 20.18.0
   nvm use 20.18.0
   ```

## Part 1: Backend Server Setup

### 1.1 Configure Environment

```bash
cd /home/ubuntu/code/reachme/server1
cp .env.example .env
nano .env
```

Update these values in `.env`:

```bash
# Google OAuth (REQUIRED - Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Session Security (CHANGE THESE!)
SESSION_SECRET=change-this-to-a-random-string-minimum-32-chars
JWT_SECRET=change-this-to-another-random-string-minimum-32-chars

# Development mode
NODE_ENV=development
```

### 1.2 Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
2. Go to **Credentials** → Edit OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   - Local development: `https://reachme2.com:8052/oauth/google/callback`
   - Production (remote): `https://b.c.sel2in.com:8088/oauth/google/callback`

### 1.3 Install Dependencies

```bash
npm install
```

### 1.4 Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start on:
- **Local Dev:** `https://reachme2.com:8052`
- **Production:** `https://b.c.sel2in.com:8088`

### 1.5 Test the Server

```bash
# Test health endpoint
curl -k https://reachme2.com:8052/health

# Expected output:
# {"status":"ok","environment":"development","baseUrl":"https://reachme2.com","timestamp":"..."}
```

## Part 2: React Native Client Setup

### 2.1 Configure Environment

```bash
cd /home/ubuntu/code/reachme/client
```

The `.env` file is already configured with:
```bash
API_BASE_URL=https://reachme2.com:8052
GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2.2 Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2.3 Clear Metro Cache (Important!)

Since we changed environment variables:
```bash
npm start -- --reset-cache
```

### 2.4 Run the App

**In a new terminal, run Android:**
```bash
cd /home/ubuntu/code/reachme/client
npm run android
```

**Or run Web:**
```bash
npm run web
```

## Part 3: Testing OAuth Flow

### 3.1 Test from Browser

1. Open: `https://reachme2.com:8052/oauth/google`
2. Complete Google sign-in
3. You'll receive a JSON response with your JWT token

### 3.2 Test from Client App

1. Open the React Native app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You should be logged in

## Part 4: Production Deployment

### 4.1 Backend Production Settings

Edit `server1/.env`:
```bash
NODE_ENV=production
```

The server will automatically use:
- Base URL: `https://b.c.sel2in.com`
- Port: `8088`
- OAuth callback: `https://b.c.sel2in.com:8088/oauth/google/callback`

### 4.2 Client Production Settings

Edit `client/.env`:
```bash
API_BASE_URL=https://b.c.sel2in.com:8088
```

Then rebuild:
```bash
npm start -- --reset-cache
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native Client                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Android    │  │     iOS      │  │     Web      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              Express Backend Server (SSL)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Port 8052 (dev) / 8088 (prod)                       │  │
│  │                                                       │  │
│  │  Routes:                                             │  │
│  │  • /oauth/google              - OAuth login          │  │
│  │  • /oauth/google/callback     - OAuth callback       │  │
│  │  • /api/user/check           - User authorization    │  │
│  │  • /reachme/check            - Command polling       │  │
│  │  • /getFile                  - File download         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   MariaDB Database (TODO)                    │
│  • Users          • Devices         • Commands              │
│  • Sessions       • Files           • Logs                  │
└─────────────────────────────────────────────────────────────┘
```

## Environment Summary

### Local Development (Current Machine)
- **Backend:** `https://reachme2.com:8052`
- **Frontend:** `http://localhost:8080` (web) or React Native app
- **OAuth Callback:** `https://reachme2.com:8052/oauth/google/callback`

### Production (Remote Server - to be deployed)
- **Backend:** `https://b.c.sel2in.com:8088`
- **Frontend:** React Native app or web deployment
- **OAuth Callback:** `https://b.c.sel2in.com:8088/oauth/google/callback`

## Common Issues

### 1. "Certificate not trusted" error

This is normal for self-signed certificates in development. Use `-k` flag with curl:
```bash
curl -k https://reachme2.com:8052/health
```

In browsers, click "Advanced" → "Proceed to site"

### 2. "CORS error" in browser

Make sure the client origin is in `server1/.env`:
```bash
CORS_ORIGINS=http://localhost:8080,https://reachme2.com,https://b.c.sel2in.com
```

### 3. Google OAuth fails

- Verify redirect URI is added to Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in server `.env`
- Make sure you're using the Web Client ID (not Android/iOS)

### 4. React Native can't connect to server

- Make sure backend server is running
- Check `API_BASE_URL` in client `.env`
- Restart Metro with cache clear: `npm start -- --reset-cache`
- For Android emulator, use `10.0.2.2` instead of `localhost`

## Next Steps

1. **Database Integration:** Set up MariaDB and create tables
2. **User Management:** Implement user authorization logic
3. **Command System:** Build command queue and processing
4. **File Management:** Implement file upload/download
5. **Testing:** Add unit and integration tests
6. **Monitoring:** Set up logging and error tracking

## Helpful Commands

```bash
# Backend
cd /home/ubuntu/code/reachme/server1
npm run dev                    # Start with auto-reload
npm start                      # Start production
curl -k https://reachme2.com:8052/health

# Client
cd /home/ubuntu/code/reachme/client
npm start -- --reset-cache     # Clear Metro cache
npm run android                # Run Android app
npm run web                    # Run web version

# System
sudo nano /etc/hosts           # Edit hosts file
nvm use 20.18.0               # Switch Node version
```

## Support Files

- Backend README: `server1/README.md`
- Client QUICKSTART: `client/QUICKSTART.md`
- Environment examples:
  - `server1/.env.example`
  - `client/.env.example`
