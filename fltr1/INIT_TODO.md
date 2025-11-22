Initial ReachMe Flutter init TODO

- [x] Change Android package to `com.sel2in.reachme` (android/app files)
- [ ] Add app configuration (server base URL) and environment handling
- [ ] Implement `AuthService` scaffold (login, token handling)
- [ ] Implement `StorageService` for local token/storage
- [ ] Add `PollService` scaffold to fetch alarms/messages from server
- [ ] Add simple `Home` screen showing authenticated user email
- [ ] Wire simple manual polling UI to test API integration
- [ ] Build and run on Android device, verify network calls

Notes:
- Start with small, testable increments and run the app after each change.
- Backend server URL should default to local dev server (http://10.0.2.2:3000 for emulator) or `adb reverse` / device IP for a physical device.
