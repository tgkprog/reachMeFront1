import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'package:permission_handler/permission_handler.dart';
// Using ISO timestamp instead of adding a dependency on `intl`.
import 'package:flutter/services.dart';
import '../services/file_logger.dart';

class InitialScreen extends StatefulWidget {
  const InitialScreen({super.key});

  @override
  State<InitialScreen> createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  bool _busy = false;
  int _step = 1; // 1: WRITE_SETTINGS, 2: SCHEDULE_EXACT_ALARM, 3: STORAGE
  final MethodChannel _channel = const MethodChannel('reachme/audio');

  Future<void> _onNext() async {
    setState(() => _busy = true);

    if (_step == 1) {
      // Step 1: ensure WRITE_SETTINGS permission (special).
      bool canWrite = false;
      try {
        final res = await _channel.invokeMethod<bool>('canWriteSettings');
        canWrite = res == true;
      } catch (e) {
        canWrite = false;
      }

      if (!canWrite) {
        // Open Manage Write Settings page for this app
        final intent = AndroidIntent(
          action: 'android.settings.action.MANAGE_WRITE_SETTINGS',
          data: 'package:${kReleaseMode ? const String.fromEnvironment('APPLICATION_ID', defaultValue: '') : 'com.sel2in.reachme'}',
        );
        try {
          await intent.launch();
        } catch (_) {}
        // Wait for user to grant; keep on this step until they press Next again
        setState(() => _busy = false);
        return;
      }

      // proceed to step 2
      setState(() {
        _step = 2;
        _busy = false;
      });
      return;
    }

    if (_step == 2) {
      // Step 2: request exact alarm scheduling permission (open system settings)
      try {
        final alarmIntent = AndroidIntent(action: 'android.settings.action.REQUEST_SCHEDULE_EXACT_ALARM');
        await alarmIntent.launch();
      } catch (_) {}

      // proceed to step 3
      setState(() {
        _step = 3;
        _busy = false;
      });
      return;
    }

    if (_step == 3) {
      // Step 3: request storage permission (manage external storage on Android 11+ or WRITE_EXTERNAL_STORAGE)
      if (Platform.isAndroid) {
        // Request manageExternalStorage; if not available, fall back to WRITE_EXTERNAL_STORAGE
        try {
          if (await Permission.manageExternalStorage.isGranted) {
            // already granted
          } else {
            final status = await Permission.manageExternalStorage.request();
            if (!status.isGranted) {
              // If manageExternalStorage not granted, try legacy storage permission
              await Permission.storage.request();
            }
          }
        } catch (_) {
          // Fallback to storage permission
          await Permission.storage.request();
        }
      }

      // After requesting storage permissions, attempt to write log only if granted
      bool canWriteFile = false;
      if (Platform.isAndroid) {
        if (await Permission.manageExternalStorage.isGranted || await Permission.storage.isGranted) {
          canWriteFile = true;
        }
      } else {
        canWriteFile = true;
      }

      if (canWriteFile) {
        final now = DateTime.now();
        final stamp = now.toIso8601String();
        await FileLogger.append('ReachMe log start: $stamp');
        await FileLogger.append('WRITE_SETTINGS: granted');
        await FileLogger.append('Requested exact alarm permission via settings');
        await FileLogger.append('STORAGE: granted');
        await FileLogger.append('--- end ---');
        if (mounted) {
          final path = Platform.isAndroid ? '/sdcard/readme.txt' : '${Directory.current.path}/readme.txt';
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Wrote log to $path')));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Storage permission not granted')));
        }
      }

      // After finishing the flow, navigate to the main login/home screen
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/');
      }

      setState(() => _busy = false);
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final stepLabel = _step == 1
        ? 'Step 1: Grant Write Settings'
        : _step == 2
            ? 'Step 2: Allow Exact Alarm'
            : 'Step 3: Allow Storage Access';

    final buttonLabel = _step == 1
        ? 'Next: Write Settings'
        : _step == 2
            ? 'Next: Schedule Alarm'
            : 'Next: File Access (write)';

    return Scaffold(
      appBar: AppBar(title: const Text('Initial Setup')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 32),
              Text(stepLabel),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _busy ? null : _onNext,
                child: _busy ? const CircularProgressIndicator() : Text(buttonLabel),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
