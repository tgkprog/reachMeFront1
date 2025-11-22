import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../http/io_client_factory.dart';
import 'storage_service.dart';
import '../config.dart';

class TokenService {
  TokenService._internal();
  static final TokenService _instance = TokenService._internal();
  factory TokenService() => _instance;

  final StorageService _storage = StorageService();

  DateTime? _expiry;
  Timer? _refreshTimer;

  Future<void> init() async {
    final token = await getToken();
    if (token != null) {
      _scheduleFromToken(token);
    }
  }

  Future<String?> getToken() => _storage.readToken();

  Future<void> setToken(String token) async {
    await _storage.saveToken(token);
    _scheduleFromToken(token);
  }

  Future<void> clearToken() async {
    _refreshTimer?.cancel();
    _expiry = null;
    await _storage.deleteToken();
  }

  void _scheduleFromToken(String token) {
    try {
      _refreshTimer?.cancel();
      final exp = _parseExpiryFromJwt(token);
      if (exp != null) {
        _expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
        // Schedule refresh 60 seconds before expiry or at half-life if very short
        final now = DateTime.now().toUtc();
        var refreshAt = _expiry!.subtract(const Duration(seconds: 60));
        if (refreshAt.isBefore(now)) {
          // if already near expiry, refresh in 5 seconds
          refreshAt = now.add(const Duration(seconds: 5));
        }
        final delay = refreshAt.difference(now);
        _refreshTimer = Timer(delay, () async {
          // best-effort refresh using stored user email
          final userJson = await _storage.readUser();
          if (userJson != null) {
            try {
              final Map<String, dynamic> user = jsonDecode(userJson);
              final email = user['email']?.toString();
              if (email != null) await refreshToken(email: email);
            } catch (_) {}
          }
        });
      }
    } catch (_) {}
  }

  int? _parseExpiryFromJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return null;
      String payload = parts[1];
      // Base64Url decode helper
      String normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final Map<String, dynamic> obj = jsonDecode(decoded);
      if (obj.containsKey('exp')) {
        final exp = obj['exp'];
        if (exp is int) return exp;
        if (exp is String) return int.tryParse(exp);
        if (exp is double) return exp.toInt();
      }
    } catch (_) {}
    return null;
  }

  /// Attempt to refresh token using server endpoint `/user/token/refresh`.
  /// The server expects headers `token` and `email` and a plain-text body "refresh".
  /// On success, it should return either JSON `{ token: '...' }` or plain token text.
  Future<bool> refreshToken({required String email}) async {
    try {
      final current = await getToken();
      if (current == null) return false;

      final client = createIOClient();
      final uri = Uri.parse(buildUrl('/user/token/refresh'));
      final resp = await client.post(uri,
          headers: {
            'token': current,
            'email': email,
            'Content-Type': 'text/plain'
          },
          body: 'refresh');

      if (resp.statusCode == 200) {
        final body = resp.body.trim();
        String? newToken;
        try {
          final parsed = jsonDecode(body);
          if (parsed is Map && parsed['token'] != null) {
            newToken = parsed['token'].toString();
          }
        } catch (_) {}
        newToken ??= body.isNotEmpty ? body : null;
        if (newToken != null && newToken.isNotEmpty) {
          await setToken(newToken);
          return true;
        }
      }
    } catch (e) {
      if (kDebugMode) print('Token refresh failed: $e');
    }
    return false;
  }
}

final tokenService = TokenService();
