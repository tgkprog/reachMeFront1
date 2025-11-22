import 'dart:convert';
import 'package:http/io_client.dart';
import '../config.dart';
import '../http/io_client_factory.dart';
import 'storage_service.dart';

class AuthService {
  final StorageService _storage;

  AuthService([StorageService? storage]) : _storage = storage ?? StorageService();

  // Use a single IOClient instance so the underlying HttpClient's
  // badCertificateCallback is preserved.
  IOClient? _client;

  IOClient _getClient() {
    _client ??= createIOClient();
    return _client!;
  }

  /// Calls the server ping endpoint and returns the raw body string.
  Future<String> ping() async {
    final uri = Uri.parse(pingUrl());
    final resp = await _getClient().get(uri);
    if (resp.statusCode == 200) return resp.body;
    throw Exception('Ping failed: ${resp.statusCode}');
  }

  /// Password login. Expects server to respond with JSON containing at least
  /// a `token` field and optionally a `user` object. On success token is stored.
  Future<Map<String, dynamic>> passwordLogin(String email, String password) async {
    final uri = Uri.parse(loginUrl());
    final resp = await _getClient().post(uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}));

    if (resp.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(resp.body);
      final token = data['token'] as String?;
      if (token != null && token.isNotEmpty) {
        await _storage.saveToken(token);
      }
      // Save user object if present
      final user = data['user'];
      if (user != null) {
        try {
          await _storage.saveUser(jsonEncode(user));
        } catch (_) {}
      }
      return data;
    }

    String msg = resp.body;
    try {
      final parsed = jsonDecode(resp.body);
      if (parsed is Map && parsed['message'] != null) msg = parsed['message'];
    } catch (_) {}

    throw Exception('Login failed: ${resp.statusCode} - $msg');
  }

  Future<void> logout() async {
    await _storage.deleteToken();
    await _storage.deleteUser();
  }
}
