import 'dart:convert';
import 'package:http/io_client.dart';
import '../http/io_client_factory.dart';
import 'storage_service.dart';
import '../config.dart';
import 'token_service.dart';

class MessagesService {
  final StorageService _storage;

  MessagesService([StorageService? storage]) : _storage = storage ?? StorageService();

  IOClient? _client;
  IOClient _getClient() {
    _client ??= createIOClient();
    return _client!;
  }

  /// Fetch messages for the authenticated user. Returns a list of message maps.
  Future<List<Map<String, dynamic>>> fetchMessages() async {
    final token = await _storage.readToken();
    if (token == null) throw Exception('No auth token');

    final uri = Uri.parse(messagesUrl());
    final resp = await _getClient().get(uri, headers: {'Authorization': 'Bearer $token'});
    if (resp.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(resp.body);
      final List<dynamic> messages = data['messages'] ?? data['rows'] ?? [];
      return messages.map<Map<String, dynamic>>((m) => Map<String, dynamic>.from(m as Map)).toList();
    }
    // If unauthorized, attempt token refresh once and retry
    if (resp.statusCode == 401) {
      // try to obtain user email from stored user object
      final userJson = await _storage.readUser();
      if (userJson != null) {
        try {
          final Map<String, dynamic> user = jsonDecode(userJson);
          final email = user['email']?.toString();
          if (email != null) {
            final refreshed = await tokenService.refreshToken(email: email);
            if (refreshed) {
              final newToken = await _storage.readToken();
              if (newToken != null) {
                final retry = await _getClient().get(uri, headers: {'Authorization': 'Bearer $newToken'});
                if (retry.statusCode == 200) {
                  final Map<String, dynamic> data = jsonDecode(retry.body);
                  final List<dynamic> messages = data['messages'] ?? data['rows'] ?? [];
                  return messages.map<Map<String, dynamic>>((m) => Map<String, dynamic>.from(m as Map)).toList();
                }
              }
            }
          }
        } catch (_) {}
      }
    }
    throw Exception('Fetch messages failed: ${resp.statusCode}');
  }
}
