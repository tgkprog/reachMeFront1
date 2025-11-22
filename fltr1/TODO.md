# TODO — fltr1 (priority for build 002)

This file lists actionable work items to get the app to reliably poll and surface alarms.

- Short/Immediate (Option A - low effort)
- Change polling interval to 10s (already applied to `HomeScreen` and `SplashScreen`).
- Fix analyzer warnings:
  - Remove or use `_pingResult` in `lib/screens/home_screen.dart`.
  - Guard `BuildContext` usage across async gaps by checking `mounted` before using `context` or Navigator (files: `home_screen.dart`, `splash_screen.dart`, `profile_screen.dart`).
  - Remove unused `_requestOther` in `lib/screens/permission_flow.dart`.

- Medium (Option B - recommended for reliability)
- Implement a native Android foreground polling service that:
  - Is started from Flutter (MethodChannel) after login with the auth token and a 10s interval.
  - Runs as a foreground service with a persistent notification.
  - Polls the server every 10s and, when an alarm message is received, brings the app to foreground and triggers the alarm flow (notification, UI overlay, native audio playback).
  - Provides Start/Stop commands and does not persist scheduled alarms across boot (per project decision).

Alternative (if native service is not desired)
- Implement headless Flutter background execution (attach a background FlutterEngine) to run `PollService` in Dart while app is backgrounded — more complex and heavier.

Testing & QA
- Verify login saves token and `pollService` runs every 10s while app is in foreground.
- Test alarm message delivery: server should return an alarm payload — verify UI overlay and audio playback.
- On Android device: test the native foreground poller (once implemented) to ensure it keeps running when the app is backgrounded and that it correctly brings the app to foreground and plays the alarm.

Notes
- `android_intent_plus` was bumped to `^6.0.0` to avoid Gradle/AGP namespace errors during Android builds.

If you want, I can implement the native foreground polling service next (I'll add Kotlin files, MethodChannel plumbing, and a small polling loop).  
