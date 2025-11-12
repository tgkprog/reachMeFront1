# ReachMe Setup Checklist

Complete this checklist before launching the ReachMe app.

## ☑️ Pre-Installation

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should be 18.0.0 or higher
  ```

- [ ] **Android Studio** installed (for Android development)
  - Android SDK 26+ (API Level 26)
  - Android Build Tools
  - Android Emulator (optional, physical device recommended)

- [ ] **Git** installed and configured

- [ ] **Code editor** (VS Code recommended)

---

## ☑️ Project Setup

- [ ] **Clone/Download** project to local machine

- [ ] **Install dependencies**
  ```bash
  cd /home/ubuntu/code/reachme/client
  npm install
  ```

- [ ] **Verify installation**
  ```bash
  npm list react-native
  npm list @react-navigation/native
  npm list react-native-webview
  npm list @react-native-picker/picker
  ```

---

## ☑️ Google OAuth Configuration

- [ ] **Create Google Cloud Project**
  - Go to: https://console.cloud.google.com/
  - Create new project or select existing
  - Project name: `ReachMe`

- [ ] **Enable Google Sign-In API**
  - Navigate to: APIs & Services → Library
  - Search: "Google Sign-In API"
  - Click: Enable

- [ ] **Configure OAuth Consent Screen**
  - Navigate to: APIs & Services → OAuth consent screen
  - User Type: External (or Internal for G Suite)
  - App name: `ReachMe`
  - User support email: Your email
  - Developer contact: Your email
  - Scopes: Add `userinfo.email` and `userinfo.profile`
  - Test users: Add your email for testing

- [ ] **Create OAuth 2.0 Credentials**
  - Navigate to: APIs & Services → Credentials
  - Create Credentials → OAuth 2.0 Client ID
  - Application type: Web application
  - Name: `ReachMe Web Client`
  - Authorized redirect URIs: (leave empty for now)
  - Click: Create
  - **COPY THE CLIENT ID** (looks like: `123456-abc.apps.googleusercontent.com`)

- [ ] **Update code with Client ID**
  - File: `src/screens/LoginScreen.tsx`
  - Line: ~25
  - Replace: `'YOUR_ACTUAL_WEB_CLIENT_ID'`
  - With: Your actual Client ID

---

## ☑️ Backend API Configuration

- [ ] **Backend server is running**
  - Verify server is accessible
  - Test with: `curl https://your-api.com/health`

- [ ] **Backend implements required endpoints**
  - [ ] `POST /api/user/check` - User authorization
  - [ ] `GET /reachme/check?deviceId={id}` - Command polling
  - [ ] `GET /getFile?id={fileId}` - File download

- [ ] **Update API URLs in code**
  - [ ] `src/services/AuthService.ts` - Line ~5
  - [ ] `src/services/PollService.ts` - Line ~5
  - [ ] `src/services/CommandHandler.ts` - Line ~150
  - Replace: `'https://your-api.com'`
  - With: Your actual API URL

- [ ] **Test backend endpoints**
  ```bash
  # Test user check
  curl -X POST https://your-api.com/api/user/check \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  
  # Test command polling
  curl https://your-api.com/reachme/check?deviceId=test123
  ```

- [ ] **Configure CORS for web** (if using web version)
  - Add `http://localhost:8080` to allowed origins
  - Add your production domain to allowed origins

---

## ☑️ Environment Variables (Optional)

- [ ] **Copy .env.example to .env**
  ```bash
  cp .env.example .env
  ```

- [ ] **Fill in environment variables**
  - `API_BASE_URL`
  - `GOOGLE_WEB_CLIENT_ID`
  - Other optional values

---

## ☑️ Android Build Configuration

- [ ] **Open Android project in Android Studio**
  ```bash
  cd android
  open -a "Android Studio" .  # macOS
  # or just open android/ folder in Android Studio
  ```

- [ ] **Sync Gradle files**
  - File → Sync Project with Gradle Files
  - Wait for sync to complete
  - Fix any errors

- [ ] **Verify AndroidManifest.xml**
  - File: `android/app/src/main/AndroidManifest.xml`
  - Verify all 20+ permissions are present
  - Verify all services/receivers are declared

- [ ] **Verify build.gradle**
  - App-level: `android/app/build.gradle`
  - Project-level: `android/build.gradle`
  - Check `minSdkVersion 26`, `targetSdkVersion 34`

---

## ☑️ Android Device Setup

- [ ] **Enable Developer Options**
  - Settings → About Phone → Tap "Build Number" 7 times

- [ ] **Enable USB Debugging**
  - Settings → Developer Options → USB Debugging

- [ ] **Connect device via USB**

- [ ] **Verify device connection**
  ```bash
  adb devices
  # Should show your device listed
  ```

- [ ] **Install app on device**
  ```bash
  npm run android
  # or
  npx react-native run-android
  ```

---

## ☑️ First Launch & Permissions

- [ ] **Open app on device**

- [ ] **Complete OAuth login**
  - Tap "Sign in with Google"
  - Select Google account
  - Grant permissions
  - Wait for backend user check
  - Should navigate to Controls screen

- [ ] **Grant all Android permissions**
  - Tap: "Check All Permissions" button
  - For each permission:

  - [ ] **Overlay Permission**
    - Settings → Apps → ReachMe → Display over other apps
    - Toggle: ON

  - [ ] **DND Access**
    - Settings → Apps → ReachMe → Do Not Disturb access
    - Toggle: ON

  - [ ] **Exact Alarms**
    - Settings → Apps → ReachMe → Alarms & reminders
    - Toggle: ON

  - [ ] **Battery Optimization**
    - Settings → Apps → ReachMe → Battery
    - Select: Unrestricted

  - [ ] **Notifications** (Android 13+)
    - Should auto-prompt on first launch
    - Or: Settings → Apps → ReachMe → Notifications
    - Toggle: ON

- [ ] **Verify foreground service running**
  - Pull down notification shade
  - Should see: "ReachMe is running in background"

---

## ☑️ Feature Testing

### Test DND Bypass

- [ ] Enable Do Not Disturb on device
  - Settings → Sound → Do Not Disturb → Turn on

- [ ] Trigger alert from backend
  - Send alert command to `/reachme/check` endpoint

- [ ] **Verify:** Alarm plays despite DND mode

- [ ] **Verify:** Overlay appears with 3 buttons

- [ ] Test buttons:
  - [ ] Green checkmark: Dismisses overlay and stops alarm
  - [ ] Red X: Stops alarm only
  - [ ] Snooze: Hides overlay (alarm continues for now)

### Test Foreground Service

- [ ] Close app (swipe away from recents)

- [ ] **Verify:** Service notification still shows

- [ ] **Verify:** Polling continues (check server logs)

- [ ] Reboot device

- [ ] **Verify:** Service auto-starts after boot

- [ ] **Verify:** Service notification appears

### Test Sleep Mode

- [ ] Open app → Controls screen

- [ ] Set sleep: 0 days, 0 hours, 5 minutes

- [ ] Tap "Set Sleep"

- [ ] **Verify:** Confirmation message

- [ ] **Verify:** Polling stops (check server logs)

- [ ] Wait 5 minutes

- [ ] **Verify:** Polling resumes

### Test Mute Mode

- [ ] Open app → Controls screen

- [ ] Set mute: 0 days, 0 hours, 5 minutes

- [ ] Tap "Set Mute"

- [ ] Trigger alert from backend

- [ ] **Verify:** Polling continues (server shows request)

- [ ] **Verify:** Alarm does NOT play

- [ ] Wait 5 minutes

- [ ] Trigger alert again

- [ ] **Verify:** Alarm plays normally

### Test Poll Interval

- [ ] Open app → Controls screen

- [ ] Set poll: 0 minutes, 30 seconds

- [ ] Tap "Update Poll Interval"

- [ ] **Verify:** Server receives requests every ~30 seconds

- [ ] Change to: 1 minute, 0 seconds

- [ ] **Verify:** Interval updates to 60 seconds

### Test Custom Sounds

- [ ] Send download command from backend:
  ```json
  {
    "type": "download",
    "id": "custom123",
    "url": "https://your-api.com/getFile?id=sound.mp3"
  }
  ```

- [ ] **Verify:** File downloads (check logs)

- [ ] Send alert with custom sound:
  ```json
  {
    "type": "alert",
    "tone": "file",
    "fileId": "custom123",
    "title": "Custom Sound Test",
    "msg": "Testing custom alarm tone"
  }
  ```

- [ ] **Verify:** Custom sound plays

### Test Logout

- [ ] Open app → Controls → Logout

- [ ] Confirm logout

- [ ] **Verify:** Navigates to login screen

- [ ] **Verify:** Encrypted storage cleared

- [ ] **Verify:** Service stops

---

## ☑️ Web Version Testing

- [ ] **Start web development server**
  ```bash
  npm run web
  ```

- [ ] **Open in browser**
  - URL: http://localhost:8080

- [ ] **Test Google OAuth**
  - Should work same as mobile

- [ ] **Test browser notifications**
  - Grant notification permission when prompted
  - Trigger alert from backend
  - **Verify:** Browser notification appears
  - **Note:** No DND bypass (browser limitation)

- [ ] **Test in multiple browsers**
  - [ ] Chrome/Chromium
  - [ ] Firefox
  - [ ] Safari (macOS)
  - [ ] Edge

---

## ☑️ OEM-Specific Configuration

### Samsung Devices

- [ ] Settings → Apps → ReachMe → Battery
  - Background restriction: **Disabled**

- [ ] Settings → Device care → Battery
  - App power management → Apps that won't be put to sleep
  - **Add ReachMe**

### Xiaomi Devices

- [ ] Settings → Apps → Manage apps → ReachMe
  - Autostart: **Enabled**
  - Battery saver: **No restrictions**

### Huawei Devices

- [ ] Settings → Apps → Apps → ReachMe → Launch
  - Manage manually: **Enable**
  - Auto-launch: **ON**
  - Secondary launch: **ON**
  - Run in background: **ON**

### OnePlus Devices

- [ ] Settings → Apps → ReachMe → Battery
  - Battery optimization: **Don't optimize**

---

## ☑️ Production Build

### Android Release APK

- [ ] **Generate signing key**
  ```bash
  cd android/app
  keytool -genkeypair -v -storetype PKCS12 \
    -keystore reachme-release.keystore \
    -alias reachme -keyalg RSA -keysize 2048 \
    -validity 10000
  ```

- [ ] **Configure gradle.properties**
  - Add keystore credentials
  - **DO NOT** commit to git

- [ ] **Update app/build.gradle**
  - Add release signing config

- [ ] **Build release APK**
  ```bash
  cd android
  ./gradlew assembleRelease
  ```

- [ ] **Test release APK**
  - Install on device: `adb install app/build/outputs/apk/release/app-release.apk`
  - Test all features
  - Verify no debug logging

### Web Production Build

- [ ] **Build web bundle**
  ```bash
  npm run build:web
  ```

- [ ] **Test production build locally**
  ```bash
  npx serve build
  ```

- [ ] **Deploy to web server**
  - Upload `build/` directory
  - Configure HTTPS
  - Update CORS on backend

---

## ☑️ Documentation Review

- [ ] Read `README.md` - Full documentation
- [ ] Review `TODO.md` - Known issues and future tasks
- [ ] Follow `QUICKSTART.md` - Verify setup steps
- [ ] Check `CONFIGURATION.md` - All configuration complete
- [ ] Review `PROJECT_SUMMARY.md` - Understand architecture

---

## ☑️ Final Checks

- [ ] All lint errors resolved (or only expected errors)

- [ ] All TypeScript errors resolved

- [ ] No console errors in web version

- [ ] No logcat errors in Android version

- [ ] App works offline (after initial login)

- [ ] App survives device rotation

- [ ] App handles no network gracefully

- [ ] All error messages user-friendly

- [ ] Loading states shown appropriately

- [ ] No sensitive data in logs

---

## ☑️ Monitoring & Analytics (Optional)

- [ ] Set up Sentry for crash reporting

- [ ] Set up Firebase Analytics

- [ ] Set up backend logging for API calls

- [ ] Set up uptime monitoring for backend

---

## 🎉 Launch Checklist

Before going live:

- [ ] All items above completed
- [ ] Tested on multiple devices
- [ ] Tested on multiple Android versions
- [ ] Backend is production-ready and stable
- [ ] Backup/restore mechanism in place
- [ ] Support documentation prepared
- [ ] User onboarding flow tested
- [ ] Privacy policy prepared
- [ ] Terms of service prepared
- [ ] App store listing prepared (if publishing)

---

## 📞 Support

If you encounter issues:

1. Check `README.md` troubleshooting section
2. Review `CONFIGURATION.md` for setup details
3. Check device logs: `adb logcat | grep ReachMe`
4. Check web console for errors
5. Verify backend is responding correctly

---

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## Quick Reference

**Start Development:**
```bash
# Android
npm run android

# Web
npm run web
```

**Check Device:**
```bash
adb devices
adb logcat | grep ReachMe
```

**Build Release:**
```bash
# Android
cd android && ./gradlew assembleRelease

# Web
npm run build:web
```

**Common Issues:**
- Google Sign-In fails → Check Web Client ID
- Permissions not working → Use physical device
- Service killed → Disable battery optimization
- Build fails → `./gradlew clean` then rebuild
