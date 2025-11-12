# TODO List

## 🔴 Critical (Must Complete Before Launch)

### Configuration
- [ ] **Replace Google OAuth Client ID** in `src/screens/LoginScreen.tsx`
  - Get from: https://console.cloud.google.com/
  - Enable Google Sign-In API
  - Create OAuth 2.0 credentials (Web client ID)
  
- [ ] **Update API_BASE_URL** in:
  - `src/services/AuthService.ts`
  - `src/services/PollService.ts`
  - Replace `'https://your-api.com'` with actual backend URL

- [ ] **Add `react-native-webview` to package.json**
  ```bash
  npm install react-native-webview
  ```

- [ ] **Add `@react-native-picker/picker` to package.json**
  ```bash
  npm install @react-native-picker/picker
  ```

### Testing
- [ ] Test on physical Android device (emulator doesn't support all permissions)
- [ ] Test DND bypass with device in Do Not Disturb mode
- [ ] Test foreground service survival after app kill
- [ ] Test boot receiver after device reboot
- [ ] Test all 8 server command types
- [ ] Test overlay positioning on different screen sizes
- [ ] Test Web version in Chrome, Firefox, Safari

### Backend Integration
- [ ] Implement `POST /api/user/check` endpoint
- [ ] Implement `GET /reachme/check` endpoint with command queue
- [ ] Implement `GET /getFile?id={fileId}` for audio downloads
- [ ] Set up user database (allowed users table)
- [ ] Add min_poll_time logic in server response

## 🟡 High Priority

### Features
- [ ] **Add GitHub OAuth**
  - Update `LoginScreen.tsx` with GitHub sign-in button
  - Add `@react-native-google-signin/google-signin` equivalent for GitHub
  - Update `AuthService.ts` to handle GitHub tokens

- [ ] **Add Facebook OAuth**
  - Similar to GitHub integration
  - Use `react-native-fbsdk-next`

- [ ] **Implement Snooze Functionality**
  - Add AlarmManager scheduling in `OverlayService.kt`
  - Schedule reminder after snooze duration
  - Store snooze state in EncryptedSharedPreferences

- [ ] **Create `about.html` Resource File**
  - Move inline HTML from `AboutScreen.tsx` to `src/resources/about.html`
  - Use `<current-year-yyyy>` placeholder
  - Load via `require('./resources/about.html')`

### Web Enhancements
- [ ] **Add Service Worker for Background Push**
  - Create `public/service-worker.js`
  - Register in `index.web.js`
  - Handle push notifications when tab closed

- [ ] **Implement WebSocket Support**
  - Add WebSocket client in `PollService.ts`
  - Fallback to polling if WebSocket fails
  - Reconnect logic with exponential backoff

- [ ] **Add IndexedDB for Web File Storage**
  - Store downloaded audio files in IndexedDB
  - Implement in `NativeBridge.ts` web path

### UI/UX
- [ ] **Add Loading Indicators**
  - Login screen during OAuth flow
  - Controls screen during permission checks
  - About screen during WebView load

- [ ] **Add Error Boundaries**
  - Wrap screens in ErrorBoundary component
  - Graceful error messages to user

- [ ] **Improve Overlay UI**
  - Add custom styling options
  - Make overlay draggable
  - Add animation for show/hide

## 🟢 Medium Priority

### Code Quality
- [ ] **Add Unit Tests**
  - Test all service methods
  - Test command handler logic
  - Test storage encryption/decryption
  - Use Jest + React Native Testing Library

- [ ] **Add E2E Tests**
  - Use Detox for Android
  - Test critical user flows
  - Test permission scenarios

- [ ] **Add TypeScript Strict Mode**
  - Enable `strict: true` in tsconfig.json
  - Fix any type issues
  - Remove `any` types

- [ ] **Add ESLint/Prettier Pre-commit Hooks**
  - Install husky + lint-staged
  - Auto-format on commit
  - Run linter before commit

### Documentation
- [ ] **Add Architecture Diagram**
  - Visual flow: UI → Services → Native Bridge → Kotlin → Android APIs
  - Include in README.md
  - Use Mermaid or draw.io

- [ ] **Add API Documentation**
  - Document all endpoints with examples
  - Add Postman collection
  - Include error response formats

- [ ] **Add JSDoc Comments**
  - Document all public methods
  - Add parameter descriptions
  - Add return value descriptions

### DevOps
- [ ] **Set Up CI/CD**
  - GitHub Actions for automated builds
  - Run tests on PR
  - Auto-deploy to TestFlight/Play Store beta

- [ ] **Add Crash Reporting**
  - Integrate Sentry or Firebase Crashlytics
  - Track native crashes
  - Track JavaScript errors

- [ ] **Add Analytics**
  - Firebase Analytics or Amplitude
  - Track feature usage
  - Track permission grant rates

## 🔵 Low Priority (Nice to Have)

### Features
- [ ] **Add Custom Alarm Tones**
  - Allow user to record own alarm
  - Upload to server
  - Use in alerts

- [ ] **Add Multi-language Support**
  - i18n setup with react-i18next
  - Translate all UI strings
  - Support at least: English, Spanish, French

- [ ] **Add Dark Mode**
  - Use React Navigation theme support
  - Add theme toggle in settings
  - Store preference in encrypted storage

- [ ] **Add Settings Screen**
  - Configure notification sounds
  - Configure overlay position
  - Configure polling behavior

- [ ] **Add Notification History**
  - Store all received alerts
  - Display in dedicated screen
  - Allow filtering by date/type

### Performance
- [ ] **Optimize Bundle Size**
  - Use Hermes engine (already in React Native 0.73)
  - Enable ProGuard for Android
  - Analyze bundle with react-native-bundle-visualizer

- [ ] **Add Lazy Loading**
  - Lazy load screens with React.lazy
  - Code splitting for web
  - Reduce initial load time

- [ ] **Optimize Polling**
  - Implement exponential backoff on errors
  - Batch multiple commands
  - Add jitter to prevent thundering herd

### Security
- [ ] **Add Certificate Pinning**
  - Pin SSL certificates in OkHttp
  - Prevent MITM attacks
  - Update pins on certificate rotation

- [ ] **Add Code Obfuscation**
  - Obfuscate JavaScript bundle
  - Obfuscate Kotlin code with R8
  - Protect API keys

- [ ] **Add Biometric Authentication**
  - Require fingerprint/face before showing alerts
  - Optional setting for high-security users
  - Use react-native-biometrics

## 📋 Known Issues

### Android
- [ ] **Some OEMs block DND bypass** (Samsung, Xiaomi)
  - Research workarounds per manufacturer
  - Add OEM-specific instructions in app

- [ ] **Battery optimization kills service** on aggressive OEMs
  - Add manufacturer-specific battery optimization instructions
  - Detect OEM and show tailored guide

- [ ] **Overlay not clickable on some devices**
  - Add FLAG_NOT_TOUCH_MODAL
  - Test on various Android versions

### Web
- [ ] **Notifications blocked in incognito mode**
  - Detect and warn user
  - Suggest normal browsing mode

- [ ] **Audio autoplay blocked by browsers**
  - Require user gesture before first playback
  - Show instructions to user

- [ ] **Tab must stay open for polling**
  - Implement service worker solution
  - Or use WebSocket with server push

## 🎯 Future Enhancements

### iOS Support
- [ ] Port Android native modules to Swift/Objective-C
- [ ] Handle iOS permission model
- [ ] Test DND bypass on iOS (may not be possible)
- [ ] Submit to App Store

### Desktop Support
- [ ] Add Electron wrapper for desktop
- [ ] Native notifications on macOS/Windows/Linux
- [ ] System tray integration

### Smart Watch Support
- [ ] Android Wear OS app
- [ ] Vibration alerts on watch
- [ ] Quick action buttons

### Integrations
- [ ] IFTTT integration
- [ ] Zapier webhooks
- [ ] Slack notifications
- [ ] Email forwarding

---

**Priority Legend:**
- 🔴 Critical: Must be done before production launch
- 🟡 High: Should be done soon after launch
- 🟢 Medium: Improve quality and user experience
- 🔵 Low: Nice to have, not essential

**Last Updated:** January 2025
