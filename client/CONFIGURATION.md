# Configuration Guide

Complete guide to configuring the ReachMe React Native client.

## Table of Contents
1. [Google OAuth Setup](#google-oauth-setup)
2. [Backend API Configuration](#backend-api-configuration)
3. [Android Permissions](#android-permissions)
4. [Web Configuration](#web-configuration)
5. [Environment Variables](#environment-variables)
6. [Build Configuration](#build-configuration)

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name: `ReachMe`
4. Click **"Create"**

### 2. Enable Google Sign-In API

1. In project dashboard, go to **APIs & Services** → **Library**
2. Search for **"Google Sign-In API"** or **"Google Identity"**
3. Click **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (or Internal if G Suite)
3. Fill in required fields:
   - **App name:** ReachMe
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com
4. **Scopes:** Add these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. **Test users:** Add your test account emails
6. Click **"Save and Continue"**

### 4. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: `ReachMe Web Client`
5. **Authorized redirect URIs:** (leave empty for now)
6. Click **"Create"**
7. **Copy the Client ID** - looks like: `123456789-abc123.apps.googleusercontent.com`

### 5. Create Android OAuth Client (Optional for deeper integration)

1. Same screen, create another OAuth 2.0 Client ID
2. Application type: **Android**
3. Name: `ReachMe Android Client`
4. Package name: `com.reachme`
5. SHA-1 certificate fingerprint:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Copy the SHA1 fingerprint
   ```
6. Click **"Create"**

### 6. Update React Native Code

Edit `src/screens/LoginScreen.tsx`:

```typescript
// Replace line ~25
GoogleSignin.configure({
  webClientId: '123456789-abc123.apps.googleusercontent.com', // Your Web Client ID
  offlineAccess: true,
});
```

---

## Backend API Configuration

### Required Endpoints

Your backend must implement these 3 endpoints:

#### 1. User Check Endpoint
**POST** `/api/user/check`

Checks if user email is allowed to use the app.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Allowed):**
```json
{
  "allowed": true,
  "message": ""
}
```

**Response (Denied):**
```json
{
  "allowed": false,
  "message": "You are not authorized to use this app. Contact admin."
}
```

#### 2. Command Polling Endpoint
**GET** `/reachme/check?deviceId={deviceId}`

Returns pending commands for the device.

**Response:**
```json
{
  "commands": [
    {
      "type": "alert",
      "tone": "preset",
      "title": "Urgent Alert",
      "msg": "This is a test alert"
    },
    {
      "type": "download",
      "id": "sound123",
      "url": "https://api.example.com/getFile?id=sound123"
    }
  ],
  "min_poll_time": 30
}
```

**Command Types:**
- `download`: Download audio file
- `alert`: Play alarm and show overlay
- `forward`: Forward to another user
- `mute`: Mute alarms for duration
- `sleep`: Stop polling for duration
- `wake`: Resume polling
- `logout`: Logout user
- `wipe`: Clear all data

#### 3. File Download Endpoint
**GET** `/getFile?id={fileId}`

Returns audio file as binary data.

**Response:**
- Content-Type: `audio/mpeg` or `audio/wav`
- Body: Binary audio data

### Update API URLs in Code

**File 1:** `src/services/AuthService.ts`
```typescript
// Line ~5
const API_BASE_URL = 'https://api.yourbackend.com'; // Replace this
```

**File 2:** `src/services/PollService.ts`
```typescript
// Line ~5
const API_BASE_URL = 'https://api.yourbackend.com'; // Replace this
```

**File 3:** `src/services/CommandHandler.ts`
```typescript
// Line ~150 (in handleDownload)
const downloadUrl = command.url || `https://api.yourbackend.com/getFile?id=${command.id}`;
```

### CORS Configuration

If testing web version, ensure backend has CORS headers:

```javascript
// Example Express.js CORS
app.use(cors({
  origin: ['http://localhost:8080', 'https://yourdomain.com'],
  credentials: true
}));
```

---

## Android Permissions

### Permissions in AndroidManifest.xml

All required permissions are already declared in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Internet & Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Overlay Windows -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Audio & Alarms -->
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Boot Receiver -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Battery Optimization -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Runtime Permissions

Users must manually grant these special permissions:

#### 1. Overlay Permission (SYSTEM_ALERT_WINDOW)
**Why:** Show floating overlay with alert buttons

**User Flow:**
1. Tap "Check All Permissions"
2. Redirect to Settings → Apps → ReachMe → Display over other apps
3. Enable toggle

#### 2. DND Access (ACCESS_NOTIFICATION_POLICY)
**Why:** Play alarms during Do Not Disturb mode

**User Flow:**
1. Tap "Check All Permissions"
2. Redirect to Settings → Apps → ReachMe → Do Not Disturb access
3. Enable toggle

#### 3. Exact Alarms (SCHEDULE_EXACT_ALARM)
**Why:** Schedule precise alarm times for snooze feature

**User Flow:**
1. Tap "Check All Permissions"
2. Redirect to Settings → Apps → ReachMe → Alarms & reminders
3. Enable toggle

#### 4. Battery Optimization (REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
**Why:** Keep foreground service running

**User Flow:**
1. Tap "Check All Permissions"
2. Redirect to Settings → Apps → ReachMe → Battery
3. Select "Unrestricted"

#### 5. Notifications (POST_NOTIFICATIONS - Android 13+)
**Why:** Show foreground service notification

**User Flow:**
1. Automatic prompt on first launch
2. Or: Settings → Apps → ReachMe → Notifications → Enable

### OEM-Specific Settings

Some manufacturers require extra steps:

#### Samsung
- Settings → Apps → ReachMe → Battery → Background restriction: **Disabled**
- Settings → Device care → Battery → App power management → Apps that won't be put to sleep: **Add ReachMe**

#### Xiaomi
- Settings → Apps → Manage apps → ReachMe → Autostart: **Enabled**
- Settings → Apps → Manage apps → ReachMe → Battery saver: **No restrictions**

#### Huawei
- Settings → Apps → Apps → ReachMe → Launch: **Manage manually**, enable all 3 toggles

---

## Web Configuration

### HTTPS Requirement

Browser notifications and service workers require HTTPS (or localhost).

**Development:** Use localhost (works without HTTPS)
**Production:** Use HTTPS certificate

### Service Worker (Future Enhancement)

For background notifications when tab is closed:

1. Create `public/service-worker.js`:
```javascript
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icon.png',
    badge: '/badge.png'
  };
  event.waitUntil(
    self.registration.showNotification('ReachMe Alert', options)
  );
});
```

2. Register in `index.web.js`:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

### Browser Notification Permission

Users must grant notification permission:

```javascript
// Automatically requested in NativeBridge.ts
if ('Notification' in window && Notification.permission === 'default') {
  await Notification.requestPermission();
}
```

---

## Environment Variables

### Create `.env` File

Create `.env` in project root:

```env
# Backend API
API_BASE_URL=https://api.yourbackend.com

# Google OAuth
GOOGLE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id

# Optional: Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id

# Polling defaults (seconds)
DEFAULT_POLL_INTERVAL=60
MIN_POLL_INTERVAL=10
MAX_POLL_INTERVAL=180

# Feature flags
ENABLE_WEB_NOTIFICATIONS=true
ENABLE_SERVICE_WORKER=false
```

### Use in Code

Install dotenv:
```bash
npm install react-native-dotenv
```

Update `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@components': './src/components',
        '@screens': './src/screens',
        '@services': './src/services',
        '@native': './src/native',
        '@types': './src/types',
      },
    }],
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ],
};
```

Use in TypeScript:
```typescript
import {API_BASE_URL} from '@env';

const API_URL = API_BASE_URL || 'https://fallback-api.com';
```

---

## Build Configuration

### Android Release Build

#### 1. Generate Signing Key

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore reachme-release.keystore -alias reachme -keyalg RSA -keysize 2048 -validity 10000
```

Enter password and details when prompted.

#### 2. Configure Gradle

Edit `android/gradle.properties`:
```properties
REACHME_RELEASE_STORE_FILE=reachme-release.keystore
REACHME_RELEASE_KEY_ALIAS=reachme
REACHME_RELEASE_STORE_PASSWORD=your_store_password
REACHME_RELEASE_KEY_PASSWORD=your_key_password
```

Edit `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file(REACHME_RELEASE_STORE_FILE)
            storePassword REACHME_RELEASE_STORE_PASSWORD
            keyAlias REACHME_RELEASE_KEY_ALIAS
            keyPassword REACHME_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 3. Build APK

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Web Production Build

```bash
npm run build:web
```

Deploy `build/` folder to web server with HTTPS.

---

## Troubleshooting

### Google Sign-In Fails

**Error:** `DEVELOPER_ERROR`
- **Fix:** Web Client ID is incorrect or not configured properly
- **Check:** Google Cloud Console → Credentials → verify Client ID

**Error:** `SIGN_IN_CANCELLED`
- **Fix:** User cancelled sign-in flow (not an error)

**Error:** `IN_PROGRESS`
- **Fix:** Sign-in already in progress, wait for completion

### Backend Connection Fails

**Error:** `Network Error`
- **Fix:** Check API_BASE_URL is correct and reachable
- **Check:** `curl https://your-api.com/api/user/check` from terminal

**Error:** `CORS Error` (Web only)
- **Fix:** Add CORS headers to backend
- **Check:** Browser console for detailed error

### Permissions Not Granted

**Overlay not showing:**
- Check Settings → Apps → ReachMe → Display over other apps is enabled

**Alarm not playing during DND:**
- Check Settings → Apps → ReachMe → Do Not Disturb access is enabled
- Some OEMs block this entirely (rare)

**Service killed after app close:**
- Check battery optimization is disabled
- Check OEM-specific battery settings

---

## Summary Checklist

Before launching:

- [ ] Google OAuth Client ID configured
- [ ] Backend API URLs updated in all services
- [ ] Backend implements all 3 required endpoints
- [ ] Tested on physical Android device
- [ ] All permissions granted and working
- [ ] DND bypass tested and confirmed
- [ ] Foreground service survives app kill
- [ ] Overlay appears and buttons work
- [ ] Web version tested in browser
- [ ] Release APK signed and built
- [ ] Environment variables set for production

---

**Last Updated:** January 2025  
**Version:** 1.0.0
