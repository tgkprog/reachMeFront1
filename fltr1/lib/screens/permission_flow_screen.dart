import 'package:flutter/material.dart';
import 'permission_screen.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'dart:io' show Platform;

class PermissionFlowScreen extends StatefulWidget {
  const PermissionFlowScreen({super.key});

  @override
  State<PermissionFlowScreen> createState() => _PermissionFlowScreenState();
}

class _PermissionFlowScreenState extends State<PermissionFlowScreen> {
  final List<Widget> _screens = [];
  int _index = 0;

  @override
  void initState() {
    super.initState();
    // Package name used for intents that require a package URI
    const packageName = 'com.sel2in.reachme';

    _screens.addAll([
      PermissionScreen(
        title: 'Notifications Permission',
        body: 'We need permission to show notifications so you can receive alarms even when the app is not in the foreground.',
        onRequest: () async => await Permission.notification.request(),
      ),
      PermissionScreen(
        title: 'Exact Alarm Permission',
        body: 'To make sure critical alarms play at the exact time, we may ask you to grant exact alarm access. You can press Continue to open system settings and grant the permission if available.',
        onRequest: () async {
          // On Android 12+ we can request exact-alarm via a system intent. Try that first.
          if (Platform.isAndroid) {
            try {
              final intent = AndroidIntent(action: 'android.app.action.REQUEST_SCHEDULE_EXACT_ALARM');
              await intent.launch();
              return PermissionStatus.granted;
            } catch (_) {
              // fallthrough to open app settings
            }
          }
          await openAppSettings();
          return PermissionStatus.permanentlyDenied;
        },
      ),
      PermissionScreen(
        title: 'Battery Optimization',
        body: 'To ensure alarms reliably fire in the background, please exempt the app from battery optimizations (set "No restrictions"). We will open the system settings screen for you.',
        onRequest: () async {
          if (Platform.isAndroid) {
            try {
              final intent = AndroidIntent(
                action: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                data: 'package:$packageName',
              );
              await intent.launch();
              return PermissionStatus.granted;
            } catch (_) {
              // fallback
            }
          }
          await openAppSettings();
          return PermissionStatus.permanentlyDenied;
        },
      ),
      PermissionScreen(
        title: 'Display Over Other Apps',
        body: 'If you want alarm UI to appear over the lock screen or other apps, grant "Display over other apps" access. We will open the system settings for you.',
        onRequest: () async {
          if (Platform.isAndroid) {
            try {
              final intent = AndroidIntent(
                action: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
                data: 'package:$packageName',
              );
              await intent.launch();
              return PermissionStatus.granted;
            } catch (_) {
              // fallback
            }
          }
          await openAppSettings();
          return PermissionStatus.permanentlyDenied;
        },
      ),
    ]);
  }

  void _next() {
    if (_index < _screens.length - 1) {
      setState(() => _index += 1);
    } else {
      Navigator.of(context).pushReplacementNamed('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const SizedBox(height: 32),
          Expanded(child: _screens[_index]),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      // Trigger the permission request defined in the screen by calling the onRequest via Navigator
                      final screen = _screens[_index] as PermissionScreen;
                      await screen.onRequest();
                      _next();
                    },
                    child: const Text('Continue'),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(onPressed: _next, child: const Text('Skip'))
              ],
            ),
          )
        ],
      ),
    );
  }
}
