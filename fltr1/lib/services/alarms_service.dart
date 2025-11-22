import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'storage_service.dart';
import 'messages_store.dart';

/// Specification for a single sound to play
class SoundSpec {
  final String asset; // asset path e.g. 'assets/sounds/reachme_alarm.mp3'
  final double volume; // 0.0 - 1.0
  final int repeats; // number of times to play; <=0 means loop indefinitely
  const SoundSpec({required this.asset, this.volume = 1.0, this.repeats = 1});
}

/// PlaySound descriptor: max total seconds and sequence of sounds
class PlaySound {
  final int maxSeconds;
  final List<SoundSpec> sounds;
  final String preferredStream; // 'alarm' or 'music'
  const PlaySound({this.maxSeconds = 120, required this.sounds, this.preferredStream = 'alarm'});
}

class AlarmsService {
  AlarmsService._internal();
  static final AlarmsService _instance = AlarmsService._internal();
  factory AlarmsService() => _instance;

  final StorageService _storage = StorageService();
  final MessagesStore _store = MessagesStore();

  // current alarm shown as a ValueNotifier so UI can react
  final ValueNotifier<Map<String, dynamic>?> currentAlarm = ValueNotifier(null);

  final Set<String> _dismissedIds = <String>{};
  final List<Map<String, dynamic>> _storedAlarms = [];

  // audio player and notification plugin
  final AudioPlayer _player = AudioPlayer();
  final FlutterLocalNotificationsPlugin _localNotif = FlutterLocalNotificationsPlugin();
  Timer? _stopTimer;
  bool _initialized = false;
  static const MethodChannel _channel = MethodChannel('reachme/audio');

  

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    // load dismissed ids and stored alarms
    final dismissed = await _storage.readValue('dismissed_alarm_ids');
    if (dismissed != null) {
      try {
        final List<dynamic> arr = jsonDecode(dismissed);
        _dismissedIds.addAll(arr.map((e) => e.toString()));
      } catch (_) {}
    }

    final raw = await _storage.readValue('stored_alarms');
    if (raw != null) {
      try {
        final List<dynamic> arr = jsonDecode(raw);
        _storedAlarms.addAll(arr.map((e) => Map<String, dynamic>.from(e)));
      } catch (_) {}
    }

    // init notifications (basic config)
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    await _localNotif.initialize(const InitializationSettings(android: androidInit, iOS: iosInit));

    // listen for messages updates
    _store.messages.addListener(() {
      final msgs = _store.messages.value;
      _handleIncomingMessages(msgs);
    });
    // preload alarm asset if available
    try {
      await _player.setAsset('assets/sounds/reachme_alarm.mp3');
    } catch (_) {}
  }

  Future<bool> _canWriteSettings() async {
    try {
      final res = await _channel.invokeMethod<bool>('canWriteSettings');
      return res == true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveVolume(String stream) async {
    try {
      await _channel.invokeMethod('saveVolume', {'stream': stream});
    } catch (_) {}
  }

  Future<void> _setVolume(String stream, int vol) async {
    try {
      await _channel.invokeMethod('setVolume', {'stream': stream, 'volume': vol});
    } catch (_) {}
  }

  Future<void> _restoreVolume(String stream) async {
    try {
      await _channel.invokeMethod('restoreVolume', {'stream': stream});
    } catch (_) {}
  }

  void _handleIncomingMessages(List<Map<String, dynamic>> msgs) {
    for (final m in msgs) {
      final id = _extractId(m);
      if (id == null) continue;
      // store alarm (prune older than 3 days)
      _storeAlarm(m);

      if (_dismissedIds.contains(id)) continue;

      // this is new/un-dismissed alarm -> show
      currentAlarm.value = m;
      _showNotificationFor(m);
      _playAlarmLoop();
      break; // show one at a time
    }
  }

  String? _extractId(Map<String, dynamic> m) {
    if (m.containsKey('id')) return m['id']?.toString();
    if (m.containsKey('message_id')) return m['message_id']?.toString();
    if (m.containsKey('uuid')) return m['uuid']?.toString();
    if (m.containsKey('url_code')) return m['url_code']?.toString();
    return null;
  }

  void _storeAlarm(Map<String, dynamic> m) {
    try {
      final now = DateTime.now().toUtc();
      m['__stored_at'] = now.toIso8601String();
      _storedAlarms.add(Map<String, dynamic>.from(m));
      // prune older than 3 days
      _storedAlarms.removeWhere((a) {
        final s = a['__stored_at'];
        if (s == null) return false;
        try {
          final dt = DateTime.parse(s);
          return now.difference(dt).inDays >= 3;
        } catch (_) {
          return false;
        }
      });
      _saveStoredAlarms();
    } catch (_) {}
  }

  Future<void> _saveStoredAlarms() async {
    try {
      await _storage.writeValue('stored_alarms', jsonEncode(_storedAlarms));
    } catch (_) {}
  }

  Future<void> _saveDismissed() async {
    await _storage.writeValue('dismissed_alarm_ids', jsonEncode(_dismissedIds.toList()));
  }

  Future<void> dismissCurrent() async {
    final m = currentAlarm.value;
    if (m == null) return;
    final id = _extractId(m);
    if (id != null) {
      _dismissedIds.add(id);
      await _saveDismissed();
    }
    currentAlarm.value = null;
    await _stopAudio();
  }

  Future<void> _showNotificationFor(Map<String, dynamic> m) async {
    try {
      final title = m['sender'] ?? 'ReachMe Alarm';
      final body = (m['message'] ?? m['text'] ?? '').toString();
      const androidDetails = AndroidNotificationDetails('reachme_alarms', 'ReachMe Alarms', importance: Importance.max, priority: Priority.high, playSound: false);
      const iosDetails = DarwinNotificationDetails(presentSound: false);
      await _localNotif.show(0, title.toString(), body, const NotificationDetails(android: androidDetails, iOS: iosDetails));
    } catch (_) {}
  }

  Future<void> _playAlarmLoop() async {
    // Default simple alarm play: use configured PlaySound sequence if available,
    // otherwise play the bundled asset once as a fallback.
    final defaultPlay = PlaySound(
      maxSeconds: 30,
      sounds: [
        SoundSpec(asset: 'assets/sounds/reachme_alarm.mp3', volume: 1.0, repeats: 4),
        SoundSpec(asset: 'assets/sounds/reachmeAlarmLouder.mp3', volume: 1.0, repeats: -1),
      ],
      preferredStream: 'alarm',
    );
    await playSoundSequence(defaultPlay);
  }

  Future<void> _stopAudio() async {
    try {
      _stopTimer?.cancel();
      await _player.stop();
      await _player.setLoopMode(LoopMode.off);
    } catch (_) {}
  }

  List<Map<String, dynamic>> get storedAlarms => List.unmodifiable(_storedAlarms);

  /// Play the provided PlaySound sequence. Respects maxSeconds and will stop when
  /// dismissed or when maxSeconds elapse.
  Future<void> playSoundSequence(PlaySound cfg) async {
    final stopwatch = Stopwatch()..start();
    final canWrite = await _canWriteSettings();
    final streamName = cfg.preferredStream;

    if (canWrite) {
      await _saveVolume(streamName);
    }

    // Helper to compute target system volume from 0.0-1.0 range
    Future<int> toSystemVol(String stream, double frac) async {
      // Ask native side to set volume relative to max by temporarily setting max*frac
      // To compute max, we rely on native; here we pass an int 0-100 and native will map.
      return (frac * 100).toInt();
    }

    for (final spec in cfg.sounds) {
      if (stopwatch.elapsed.inSeconds >= cfg.maxSeconds) break;

      // If we have write-settings, attempt to set system stream volume
      if (canWrite) {
        final vol100 = await toSystemVol(streamName, spec.volume);
        // Native method expects absolute volume (mapped internally)
        await _setVolume(streamName, vol100);
      } else {
        // set player local volume
        try {
          await _player.setVolume(spec.volume);
        } catch (_) {}
      }

      // Play `spec.repeats` times (<=0 means loop indefinitely until maxSeconds)
      var played = 0;
      while (spec.repeats <= 0 || played < spec.repeats) {
        if (stopwatch.elapsed.inSeconds >= cfg.maxSeconds) break;
        if (currentAlarm.value == null) break; // dismissed

        try {
          await _player.setAsset(spec.asset);
          await _player.setLoopMode(LoopMode.off);
          await _player.play();

          // wait for completion or timeout
          await _player.playerStateStream.firstWhere((state) => state.processingState == ProcessingState.completed || state.playing == false);
          // small delay between repeats
          await Future.delayed(const Duration(milliseconds: 200));
        } catch (_) {
          // if asset missing or error, break this spec
          break;
        }
        played += 1;
      }
      if (currentAlarm.value == null) break;
    }

    // After sequence, if still under maxSeconds, optionally loop louder sound until timeout
    if (currentAlarm.value != null && stopwatch.elapsed.inSeconds < cfg.maxSeconds) {
      // if cfg.sounds had a final loop candidate, handle accordingly; here we just stop after sequence
      // Start a safety timer to clear alarm after remaining time
      final remaining = cfg.maxSeconds - stopwatch.elapsed.inSeconds;
      _stopTimer?.cancel();
      _stopTimer = Timer(Duration(seconds: remaining), () async {
        currentAlarm.value = null;
      });
    }

    // restore system volume if we changed it
    if (canWrite) {
      await _restoreVolume(streamName);
    }
  }
}

final alarmsService = AlarmsService();
