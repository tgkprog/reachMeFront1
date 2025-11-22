import 'package:flutter/foundation.dart';

class MessagesStore {
  // Singleton pattern with ValueNotifier so UI can listen easily.
  MessagesStore._internal();
  static final MessagesStore _instance = MessagesStore._internal();
  factory MessagesStore() => _instance;

  final ValueNotifier<List<Map<String, dynamic>>> messages = ValueNotifier([]);

  void setMessages(List<Map<String, dynamic>> ms) {
    messages.value = ms;
  }

  void clear() {
    messages.value = [];
  }
}
