# ReachMe React Native Client - Project Summary

## Overview

Complete React Native cross-platform application (Android + Web) for critical notification delivery with Do Not Disturb bypass capabilities.

**Status:** ✅ Core implementation complete, ready for configuration and testing  
**Created:** January 2025  
**Version:** 1.0.0

---

## Project Statistics

- **Total Files Created:** ~40 files
- **Lines of Code:** ~3,500+ lines
- **Languages:** TypeScript (React Native), Kotlin (Android), HTML/CSS (Web)
- **Architecture:** Hybrid native + JavaScript with native bridge pattern

---

## File Structure

```
client/
├── README.md                    # Complete documentation
├── TODO.md                      # Task list with priorities
├── QUICKSTART.md                # 5-step setup guide
├── CONFIGURATION.md             # Detailed config instructions
├── PROJECT_SUMMARY.md           # This file
├── package.json                 # Dependencies + scripts
├── tsconfig.json                # TypeScript configuration
├── metro.config.js              # React Native bundler
├── babel.config.js              # Babel with path aliases
├── .eslintrc.js                 # Linting rules
├── .prettierrc.js               # Code formatting
├── .gitignore                   # Version control exclusions
│
├── src/
│   ├── App.tsx                  # Main navigation container
│   │
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces
│   │
│   ├── native/
│   │   └── NativeBridge.ts      # Platform abstraction layer
│   │
│   ├── services/
│   │   ├── StorageService.ts    # Encrypted storage wrapper
│   │   ├── AuthService.ts       # OAuth + backend user check
│   │   ├── PollService.ts       # Server polling with sleep/mute
│   │   └── CommandHandler.ts    # Process 8 server commands
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Google OAuth with debounce
│   │   ├── ControlsScreen.tsx   # Sleep/Mute/Poll controls
│   │   └── AboutScreen.tsx      # WebView with about content
│   │
│   └── resources/
│       └── about.html           # About page HTML content
│
├── android/
│   ├── app/
│   │   ├── build.gradle         # App-level build config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml         # 20+ permissions
│   │       └── java/com/reachme/
│   │           ├── ReachMePackage.kt       # React Native package
│   │           ├── ReachMeNativeModule.kt  # Main native bridge (11 methods)
│   │           ├── CoreService.kt          # Foreground service
│   │           ├── BootReceiver.kt         # Auto-start on boot
│   │           ├── AlarmHandler.kt         # DND bypass audio
│   │           ├── OverlayService.kt       # Floating UI overlay
│   │           ├── DownloadHandler.kt      # OkHttp file downloads
│   │           └── PermissionHelper.kt     # Permission checking
│   │
│   ├── build.gradle             # Project-level build
│   └── settings.gradle          # Module inclusion
│
├── public/
│   └── index.html               # Web entry point
│
├── index.js                     # Android/iOS entry
└── index.web.js                 # Web entry
```

---

## Technology Stack

### Frontend
- **React Native 0.73.0** - Cross-platform mobile framework
- **TypeScript 5.3.3** - Type safety and IDE support
- **React Navigation 6.x** - Screen routing and navigation
- **React Native Web** - Web platform support

### Android Native
- **Kotlin 1.9.20** - Modern Android development
- **OkHttp** - HTTP client for file downloads
- **MediaPlayer** - Audio playback with USAGE_ALARM
- **WindowManager** - Overlay window management
- **AlarmManager** - Exact timing for snooze

### State & Storage
- **Encrypted Storage** - Secure local data persistence
- **AsyncStorage** - Additional key-value storage
- **In-memory state** - React hooks (useState, useEffect)

### Network
- **Axios** - HTTP client for API calls
- **Polling** - Periodic server checks (10s - 3min)
- **WebSocket** - (Planned) Real-time push

### Authentication
- **Google Sign-In** - OAuth 2.0 (implemented)
- **GitHub OAuth** - (Planned)
- **Facebook OAuth** - (Planned)

---

## Core Features

### ✅ Implemented

#### Authentication & Security
- Google OAuth 2.0 integration
- Backend user authorization check (POST /api/user/check)
- 3-minute login attempt debounce
- Encrypted storage for tokens and user data
- Automatic session management

#### Android-Specific Features
- **DND Bypass:** MediaPlayer with USAGE_ALARM attributes
- **Foreground Service:** Survives app kills and runs continuously
- **Boot Receiver:** Auto-starts service after device reboot
- **Overlay Windows:** Floating UI (15% width, top-right, 3 buttons)
- **Exact Alarms:** Precise timing for snooze functionality
- **Permission Management:** Check and request all required permissions
- **File Downloads:** OkHttp async downloads to app storage

#### Cross-Platform Features
- **Server Polling:** Configurable interval (10s - 3min)
- **Sleep Mode:** Stop polling for specified duration
- **Mute Mode:** Continue polling but don't play alarms
- **Command Handling:** 8 server command types
- **Custom Sounds:** Download and play server-provided audio
- **Navigation:** Stack navigator with 3 screens

#### Web-Specific Features
- Browser notification API
- HTML5 audio playback
- Graceful feature degradation
- Responsive UI

### 🔄 Partially Implemented

- **About Screen:** Currently uses inline HTML, external file created but not fully integrated
- **Web Service Worker:** Mentioned but not implemented
- **WebSocket Support:** Structure in place, not connected

### ⏳ Planned (See TODO.md)

- GitHub and Facebook OAuth
- Snooze reminder scheduling
- FCM push notifications
- Unit and E2E tests
- iOS platform support

---

## Server API Contract

### Required Endpoints

#### 1. POST `/api/user/check`
Check if user is allowed to login.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "allowed": true | false,
  "message": "optional error message"
}
```

#### 2. GET `/reachme/check?deviceId={deviceId}`
Return pending commands for device.

**Response:**
```json
{
  "commands": [
    {
      "type": "alert",
      "tone": "preset" | "file",
      "fileId": "optional-file-id",
      "title": "Alert Title",
      "msg": "Alert message"
    }
  ],
  "min_poll_time": 30
}
```

#### 3. GET `/getFile?id={fileId}`
Download audio file (binary MP3/WAV).

### Command Types

1. **download** - Download and store audio file
2. **alert** - Play alarm and show overlay
3. **forward** - Forward notification to another user
4. **mute** - Mute alarms for duration
5. **sleep** - Stop polling for duration
6. **wake** - Resume polling immediately
7. **logout** - Clear session (optionally keep data)
8. **wipe** - Clear all data and logout

---

## Android Permissions

### Declared in AndroidManifest.xml

**Normal Permissions (auto-granted):**
- INTERNET
- ACCESS_NETWORK_STATE
- FOREGROUND_SERVICE
- FOREGROUND_SERVICE_SPECIAL_USE
- RECEIVE_BOOT_COMPLETED
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

**Special Permissions (require user action):**
- SYSTEM_ALERT_WINDOW (overlay)
- ACCESS_NOTIFICATION_POLICY (DND access)
- SCHEDULE_EXACT_ALARM (exact alarm timing)
- REQUEST_IGNORE_BATTERY_OPTIMIZATIONS (prevent service kills)
- POST_NOTIFICATIONS (Android 13+)

---

## Architecture Patterns

### Layer Architecture

```
┌─────────────────────────────────────┐
│         React Native UI             │
│  (Screens: Login, Controls, About)  │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│        Service Layer                │
│  Auth, Storage, Poll, CommandHandler│
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│       Native Bridge                 │
│  Platform Detection & Abstraction   │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────▼──────┐   ┌────▼──────┐
│  Android   │   │    Web    │
│   Kotlin   │   │ Browser   │
│  Modules   │   │   APIs    │
└─────┬──────┘   └────┬──────┘
      │               │
┌─────▼──────┐   ┌────▼──────┐
│  Android   │   │  Browser  │
│ System APIs│   │  APIs     │
└────────────┘   └───────────┘
```

### Data Flow

**Login Flow:**
1. User taps "Sign in with Google"
2. LoginScreen checks 3-min debounce (AuthService)
3. Google OAuth popup (GoogleSignIn library)
4. Get user profile (email, name, photo)
5. Backend check: POST /api/user/check
6. If allowed: Save user to encrypted storage, navigate to Controls
7. If denied: Show error, sign out

**Polling Flow:**
1. PollService starts interval timer (user-configured)
2. Check if in sleep mode → skip poll
3. GET /reachme/check?deviceId={id}
4. Receive commands array + min_poll_time
5. Update poll interval to max(user_interval, min_poll_time)
6. Pass commands to CommandHandler
7. CommandHandler processes each command type
8. For alerts: Check mute state, then call NativeBridge
9. NativeBridge calls Kotlin module (Android) or browser API (Web)

**Alert Flow (Android):**
1. CommandHandler receives alert command
2. If muted → log and skip
3. Determine tone: preset or custom file
4. NativeBridge.playAlarm({tone, fileId, title, msg})
5. ReachMeNativeModule.playAlarm() called
6. AlarmHandler.play() → MediaPlayer with USAGE_ALARM
7. OverlayService.show() → WindowManager overlay
8. User taps button → event back to React Native

### State Management

**AuthService:**
- User profile (email, name, photo)
- OAuth tokens (access, refresh, expiry)
- Last login attempt timestamp

**StorageService (Encrypted):**
- user_profile
- auth_tokens
- sleep_state (end timestamp)
- mute_state (end timestamp)
- poll_interval (seconds)
- downloaded_files (map of fileId → localPath)

**PollService:**
- isPolling (boolean)
- currentInterval (number)
- timerId (NodeJS.Timeout)

**App Navigation:**
- isLoggedIn (boolean)
- currentScreen (Login | Controls | About)

---

## Configuration Requirements

### ⚠️ Critical - Must Complete Before Launch

1. **Google OAuth Client ID**
   - Location: `src/screens/LoginScreen.tsx` line ~25
   - Get from: https://console.cloud.google.com/
   - Replace: `'YOUR_ACTUAL_WEB_CLIENT_ID'`

2. **Backend API URL**
   - Files: `src/services/AuthService.ts`, `src/services/PollService.ts`
   - Replace: `'https://your-api.com'` with actual backend URL

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Test on Physical Android Device**
   - Emulator doesn't support all permissions
   - Test DND bypass, overlay, foreground service

### Optional Configuration

- `.env` file for environment variables
- Additional OAuth providers (GitHub, Facebook)
- Custom poll intervals and timeouts
- Web service worker for background push

---

## Build & Run

### Development

**Android:**
```bash
npm install
npm run android
# or
npx react-native run-android
```

**Web:**
```bash
npm install
npm run web
# Opens http://localhost:8080
```

### Production

**Android APK:**
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

**Web Build:**
```bash
npm run build:web
# Output: build/ directory
```

---

## Testing Checklist

### Pre-Launch Testing

- [ ] Install on physical Android device (not emulator)
- [ ] Complete Google OAuth flow successfully
- [ ] Backend user check endpoint working
- [ ] All 5 special permissions granted
- [ ] DND bypass: Enable DND, trigger alert, verify alarm plays
- [ ] Foreground service: Close app, verify service persists
- [ ] Boot receiver: Reboot device, verify service auto-starts
- [ ] Overlay: Trigger alert, verify 3 buttons appear and work
- [ ] Sleep mode: Set sleep, verify polling stops
- [ ] Mute mode: Set mute, verify alarms don't play but polling continues
- [ ] Poll interval: Change interval, verify takes effect
- [ ] Custom sounds: Download file, trigger alert with custom tone
- [ ] Logout: Verify all data cleared (or kept if keepData=true)
- [ ] Web version: Test in Chrome, Firefox, Safari

### OEM-Specific Testing

- [ ] Samsung: Battery optimization exemption
- [ ] Xiaomi: Autostart permission
- [ ] Huawei: Manual launch management
- [ ] OnePlus: Battery optimization
- [ ] Oppo: Additional background restrictions

---

## Known Limitations

### Android
- Some OEMs (Samsung, Xiaomi) have aggressive battery optimization
- DND bypass may not work on all devices (rare, mostly works)
- Overlay requires user to manually grant permission
- Force Stop kills service until user reopens app (Android limitation)

### Web
- No DND bypass (browser limitation)
- Notifications require HTTPS (or localhost)
- Tab must stay open for polling (unless service worker implemented)
- No overlay windows (browser limitation)
- Audio autoplay may be blocked by browser

### iOS
- Not yet implemented (future enhancement)
- DND bypass likely not possible on iOS
- Would require Swift/Objective-C native modules

---

## Troubleshooting

### Build Fails
```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
npm run android
```

### Google Sign-In Fails
- Verify Web Client ID is correct
- Check OAuth consent screen configured
- Add test users if app in testing mode
- Enable Google Sign-In API

### Permissions Not Working
- Must use physical device, not emulator
- Navigate to Settings and manually grant special permissions
- Check OEM-specific battery settings
- Restart app after granting permissions

### Service Killed
- Disable battery optimization
- Check OEM-specific battery settings
- Verify foreground notification is showing
- Don't Force Stop (kills service until manual reopen)

### Web Notifications Blocked
- Ensure HTTPS (or localhost)
- Check browser notification permission
- Not supported in incognito mode
- Some browsers block by default

---

## Next Steps

### Immediate (Before Launch)
1. Configure Google OAuth Client ID
2. Update backend API URLs
3. Install dependencies: `npm install`
4. Test all features on physical device
5. Set up backend endpoints

### Short-Term (Post-Launch)
1. Add GitHub and Facebook OAuth
2. Implement snooze reminder scheduling
3. Add unit tests
4. Set up CI/CD pipeline
5. Implement web service worker

### Long-Term
1. Add FCM push notifications
2. iOS platform support
3. Desktop app (Electron)
4. Smart watch integration
5. Additional integrations (IFTTT, Zapier, Slack)

---

## Documentation

- **README.md** - Complete project documentation
- **TODO.md** - Prioritized task list
- **QUICKSTART.md** - 5-step setup guide
- **CONFIGURATION.md** - Detailed configuration instructions
- **PROJECT_SUMMARY.md** - This file (high-level overview)

---

## License

[Add your license]

---

## Contributors

[Add contributors]

---

**Project Completion:** ~90% (core features complete, configuration pending)  
**Est. Time to Launch:** 1-2 days (after configuration and testing)  
**Last Updated:** January 2025
