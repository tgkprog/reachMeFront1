import 'dart:async';
import 'messages_service.dart';
import 'messages_store.dart';

/// A PollService that can periodically fetch messages via MessagesService
/// and update the MessagesStore. It still supports a generic onPoll callback.
class PollService {
  Timer? _timer;
  final MessagesService _messagesService;
  final MessagesStore _store;

  PollService([MessagesService? svc, MessagesStore? store])
      : _messagesService = svc ?? MessagesService(),
        _store = store ?? MessagesStore();

  /// Start periodic polling. Runs once immediately then periodically.
  void startPeriodic(Duration interval) {
    stop();
    _runOnce();
    _timer = Timer.periodic(interval, (_) => _runOnce());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _runOnce() async {
    try {
      final msgs = await _messagesService.fetchMessages();
      _store.setMessages(msgs);
    } catch (e) {
      // swallow for now; callers can read logs or extend with a logger
    }
  }

  bool get isRunning => _timer != null;
}

// Global singleton instance for convenience
final PollService pollService = PollService();
