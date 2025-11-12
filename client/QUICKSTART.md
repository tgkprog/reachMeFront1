# ReachMe Client - Quick Start Guide

Get the ReachMe React Native client running in 5 steps.

## Prerequisites

- Node.js 18+ installed
- For Android: Android Studio with SDK 26+
- For Web: Modern browser (Chrome, Firefox, Safari)

## Step 1: Install Dependencies

```bash
cd /home/ubuntu/code/reachme/client
npm install
```

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "Google Sign-In API"
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Add authorized redirect URIs
5. Copy the **Web Client ID**

6. Update `src/screens/LoginScreen.tsx`:
```typescript
// Line ~25
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
  offlineAccess: true,
});
```

## Step 3: Configure Backend API

Update API base URL in these files:

**`src/services/AuthService.ts`** (line ~5):
```typescript
const API_BASE_URL = 'https://your-backend-api.com';
```

**`src/services/PollService.ts`** (line ~5):
```typescript
const API_BASE_URL = 'https://your-backend-api.com';
```

## Step 4: Run the App

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

Or directly:
```bash
npx react-native run-android
```

**On Device:**
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Run `adb devices` to verify connection
5. Run `npm run android`

### Web

```bash
npm run web
```

Then open browser to: `http://localhost:8080`

## Step 5: Grant Permissions (Android Only)

On first launch:

1. Tap **"Check All Permissions"** in Controls screen
2. Grant each permission:
   - ✅ Overlay Permission (Settings → Apps → ReachMe → Display over other apps)
   - ✅ DND Access (Settings → Apps → ReachMe → Do Not Disturb access)
   - ✅ Exact Alarms (Settings → Apps → ReachMe → Alarms & reminders)
   - ✅ Battery Optimization (Settings → Apps → ReachMe → Battery → Unrestricted)
   - ✅ Notifications (Android 13+: prompt on first launch)

3. Restart app after granting permissions

## Testing

### Test DND Bypass
1. Enable Do Not Disturb on your device
2. Login to ReachMe app
3. Trigger an alert from your backend
4. **Expected:** Alarm plays despite DND mode

### Test Foreground Service
1. Open ReachMe app
2. Close app from recents (swipe away)
3. Check notification area - service should still run
4. **Expected:** "ReachMe is running in background" notification persists

### Test Overlay
1. Trigger alert from backend
2. **Expected:** Small overlay appears at top-right with 3 buttons:
   - ✅ (Green) - Dismiss and stop alarm
   - ❌ (Red) - Stop alarm only
   - 💤 Snooze - Hide for 5 minutes

## Common Issues

### Build Fails on Android

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler Port in Use

```bash
npx react-native start --reset-cache --port 8082
```

### Permissions Not Working

- Must test on **physical device** (emulator doesn't support all permissions)
- Manually navigate to Settings and grant special permissions
- Some OEMs (Samsung, Xiaomi) have extra battery restrictions

### Google Sign-In Fails

- Verify Web Client ID is correct
- Check OAuth consent screen is configured
- Add test users if app is in testing mode
- Enable Google Sign-In API in Google Cloud Console

### Web Notifications Don't Work

- Must use HTTPS (or localhost)
- Check browser allows notifications for site
- Check notification permission granted
- Some browsers block in incognito mode

## Next Steps

After successful setup:

1. **Configure Backend** - See [API Documentation](#api-documentation)
2. **Read TODO.md** - Complete critical configuration tasks
3. **Test All Features** - Verify sleep, mute, polling work
4. **Add OAuth Providers** - GitHub, Facebook (see TODO.md)

## Backend API Requirements

Your backend must implement these endpoints:

### POST `/api/user/check`
Verify if user is allowed to login.
```json
Request: { "email": "user@example.com" }
Response: { "allowed": true, "message": "" }
```

### GET `/reachme/check?deviceId={id}`
Return pending commands for device.
```json
Response: {
  "commands": [
    {"type": "alert", "tone": "preset", "title": "Test", "msg": "Hello"}
  ],
  "min_poll_time": 30
}
```

### GET `/getFile?id={fileId}`
Download audio file (binary MP3/WAV).

## Project Structure

```
client/
├── src/
│   ├── App.tsx              # Main navigation
│   ├── screens/             # UI screens
│   ├── services/            # Business logic
│   ├── native/              # Native bridge
│   └── types/               # TypeScript types
├── android/                 # Android native code
├── public/                  # Web assets
├── package.json
└── README.md                # Full documentation
```

## Development Workflow

1. **Make changes** to TypeScript/Kotlin files
2. **Hot reload** (save files, Metro auto-reloads)
3. **For native changes:** Rebuild app with `npm run android`
4. **For production build:**
   ```bash
   cd android
   ./gradlew assembleRelease
   # APK at: android/app/build/outputs/apk/release/
   ```

## Support

- Full docs: [README.md](./README.md)
- Task list: [TODO.md](./TODO.md)
- Backend requirements: See `android/appRequirements.txt`

---

**Setup Time:** ~10 minutes  
**First Run:** May take 2-3 minutes to build  
**Supported:** Android 8.0+ (API 26+), Modern browsers
