# ReachMe - React Native Client

A cross-platform (Android + Web) critical notification system built with React Native that ensures important alerts reach users even when devices are on Do Not Disturb mode.

## 🎯 Features

### Core Functionality
- **Authentication** - Google OAuth + Email/Password (Google implemented, password added)
- **DND Bypass** - Alarms play even in Do Not Disturb mode (Android only)
- **Overlay Notifications** - Floating UI with 3 action buttons (Android)
- **Foreground Service** - Survives app kills and reboots (Android)
- **Polling/Push** - Configurable server polling with WebSocket support
- **Sleep/Mute Controls** - Temporarily disable polling or alarms
- **Custom Sounds** - Download and play custom alarm tones
- **Web Support** - Browser notifications and HTML5 audio

### Screens
1. **Login/About** - OAuth providers + about content
2. **Controls** - Sleep, Mute, Poll interval configuration
3. **About** - HTML content with dynamic year replacement

## 📋 Requirements

### Development
- Node.js >= 18
- React Native 0.73+
- Android Studio (for Android)
- Web browser (for Web)

### Android
- Min SDK: 26 (Android 8.0)
- Target SDK: 34 (Android 14)
- Kotlin 1.9.20

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /home/ubuntu/code/reachme/client
npm install
# or
yarn install
```

### 2. Configure API URL & Environments

We use multiple environment files with `react-native-dotenv`:

Files:
```
.env         (default / production)
local.env    (local development)
dev.env      (dev server)
```

Switch environments by copying over `.env`:
```bash
npm run env:local   # uses https://reachme2.com:8052/
npm run env:dev     # uses https://b.c.sel2in.com/n1/
```

Then run the platform build (example):
```bash
npm run env:local && npm run android
```

### 3. Configure Google Sign-In & Password Login

Edit `src/screens/LoginScreen.tsx`:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID', // From Google Cloud Console
  offlineAccess: true,
});
```

### 4. Password Login Endpoint

Ensure backend exposes password login at relative path (default):
```
/api/user/passwordLogin  (POST { email, password })
```
Set/override via env variable `PASSWORD_LOGIN_ENDPOINT`.

### 5. Run the App

**Android:**
```bash
npm run android
# or
npx react-native run-android
```

**Web:**
```bash
npm run web
# or
yarn web
```

## 🏗️ Architecture

```
client/
├── src/
│   ├── screens/          # React screens
│   │   ├── LoginScreen.tsx
│   │   ├── ControlsScreen.tsx
│   │   └── AboutScreen.tsx
│   ├── services/         # Business logic
│   │   ├── AuthService.ts
│   │   ├── StorageService.ts
│   │   ├── PollService.ts
│   │   └── CommandHandler.ts
│   ├── native/           # Native bridge
│   │   └── NativeBridge.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── App.tsx           # Main app component
├── android/              # Android native code
│   └── app/src/main/java/com/reachme/
│       ├── ReachMeNativeModule.kt
│       ├── CoreService.kt
│       ├── AlarmHandler.kt
│       ├── OverlayService.kt
│       ├── DownloadHandler.kt
│       ├── PermissionHelper.kt
│       └── BootReceiver.kt
├── public/               # Web assets
└── package.json
```

## 📱 Android Native Modules

### ReachMeNativeModule
Main bridge between React Native and Android native code.

**Methods:**
- `showOverlay(args)` - Show floating overlay with 3 buttons
- `hideOverlay()` - Hide overlay
- `playAlarm(args)` - Play alarm with DND bypass
- `stopAlarm()` - Stop alarm playback
- `downloadFile(url, id)` - Download and store audio file
- `startForegroundService()` - Start persistent background service
- `stopForegroundService()` - Stop background service
- `checkPermissions()` - Check all required permissions
- `requestOverlayPermission()` - Request overlay permission
- `requestDNDPermission()` - Request DND access
- `requestExactAlarmPermission()` - Request exact alarm scheduling
- `requestBatteryOptimization()` - Request battery optimization exemption
- `getLocalFilePath(fileId)` - Get local path for downloaded file

### CoreService
Foreground service that:
- Runs continuously in background
- Survives app kills and RAM cleanup
- Restarts on device boot
- Maintains WebSocket/FCM connection

### AlarmHandler
Plays alarms using:
- `USAGE_ALARM` audio attributes (bypasses DND)
- Maximum alarm stream volume
- Custom or preset tones
- Looping playback

### OverlayService
Creates floating overlay:
- ~15% width at top-right
- 3 buttons: OK (green), Stop (X), Snooze
- Falls back to Activity if no overlay permission

## 🌐 Web Support

### Implemented:
- Browser notifications (requires permission)
- HTML5 audio playback
- OAuth authentication
- Polling service
- All UI screens

### Limitations:
- No DND bypass (browser limitation)
- No background when tab closed
- No overlay windows
- Limited to browser notification API

## 🔐 Permissions

### Android Permissions Required:

**Core:**
- `INTERNET` - API communication
- `FOREGROUND_SERVICE` - Background service
- `SYSTEM_ALERT_WINDOW` - Overlay windows
- `MODIFY_AUDIO_SETTINGS` - Set alarm volume
- `ACCESS_NOTIFICATION_POLICY` - DND bypass
- `RECEIVE_BOOT_COMPLETED` - Auto-start on boot
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` - Prevent service kills

**Exact Alarms:**
- `SCHEDULE_EXACT_ALARM` (Android 12+)
- `USE_EXACT_ALARM` (Android 12+)

**Storage:**
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`

**Runtime Permissions:**
- Notification permission (Android 13+)
- Storage permissions
- Special permissions via Settings intents

## 📡 Server API Integration

### Required Endpoints:

#### POST `/api/user/check`
Check if user is allowed to login.
```json
Request: {
  "email": "user@example.com"
}

Response: {
  "allowed": true | false,
  "message": "optional error message"
}
```

#### GET `/reachme/check?deviceId={id}`
Poll for commands.
```json
Response: {
  "commands": [
    {
      "type": "alert",
      "tone": "preset",
      "title": "Alert",
      "msg": "Message"
    }
  ],
  "min_poll_time": 30
}
```

#### GET `/getFile?id={fileId}`
Download audio file.
Returns binary audio file (MP3/WAV).

### Server Command Types:

1. **download** - Download and store audio file
   ```json
   {"type": "download", "id": "file123", "url": "https://..."}
   ```

2. **alert** - Play alarm and show overlay
   ```json
   {"type": "alert", "tone": "preset"|"file", "fileId": "...", "title": "...", "msg": "..."}
   ```

3. **forward** - Forward notification to another user
   ```json
   {"type": "forward", "target": "userId", "msg": "..."}
   ```

4. **mute** - Mute alarms for duration
   ```json
   {"type": "mute", "duration_ms": 3600000}
   ```

5. **sleep** - Stop polling for duration
   ```json
   {"type": "sleep", "duration_ms": 3600000}
   ```

6. **wake** - Resume polling
   ```json
   {"type": "wake"}
   ```

7. **logout** - Clear session, optionally keep data
   ```json
   {"type": "logout", "keepData": true|false}
   ```

8. **wipe** - Clear all data and logout
   ```json
   {"type": "wipe"}
   ```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
API_BASE_URL=https://your-api-url.com
GOOGLE_WEB_CLIENT_ID=your-google-client-id
```

### Poll Interval
- User selects: 0-2 minutes + 10-50 seconds
- Server sends `min_poll_time` in response
- Effective poll = `max(user_selection, server_min)`

### Sleep/Mute
- Sleep: No polling during sleep period
- Mute: Polls but doesn't play alarms
- Configured in days, hours, minutes

## 🧪 Testing

### Test DND Bypass (Android)
1. Grant all permissions via "Check All Permissions"
2. Enable Do Not Disturb on device
3. Trigger alert from server
4. Alarm should play despite DND

### Test Foreground Service
1. Start app
2. Close app from recents
3. Service continues running (check notification)
4. Reboot device
5. Service auto-starts

### Test Overlay
1. Grant overlay permission
2. Trigger alert
3. Overlay appears at top-right with 3 buttons

## 📝 TODO

See [TODO.md](./TODO.md) for complete task list.

### Critical:
- [ ] Configure Google OAuth Client ID
- [ ] Update API_BASE_URL in services
- [ ] Add `about.html` to `src/resources/`
- [ ] Test all permissions on physical device
- [ ] Set up backend API endpoints

### Enhancement:
- [ ] Add GitHub/Facebook OAuth
- [ ] Implement snooze reminder scheduling
- [ ] Add WebSocket support
- [ ] Implement FCM push notifications
- [ ] Add unit tests
- [ ] Add e2e tests

## 🐛 Troubleshooting

### Android Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Permissions Not Working
- Check that all permissions are declared in AndroidManifest.xml
- Ensure user manually grants special permissions via Settings
- Some OEMs restrict DND bypass - test on stock Android

### Service Doesn't Restart
- Force Stop kills service until user manually opens app (Android limitation)
- Ensure `RECEIVE_BOOT_COMPLETED` permission granted
- Check battery optimization is disabled

### Web Notifications Don't Work
- Ensure HTTPS (required for browser notifications)
- Check browser notification permission granted
- Test in different browsers (some block notifications)

## 📄 License

[Add your license]

## 👥 Contributors

[Add contributors]

---

**Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**Platform:** React Native 0.73  
**Android SDK:** 26-34  
**Web:** Modern browsers with notification API
