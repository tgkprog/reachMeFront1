import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:encrypt/encrypt.dart';

class StorageService {
  // Uses flutter_secure_storage to persist sensitive values like auth token
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const _tokenKey = 'auth_token';
  static const _tokenEncKey = 'token_enc_key';

  Future<void> saveToken(String token) async {
    try {
      final encKeyBase64 = await _storage.read(key: _tokenEncKey);
      Key key;
      if (encKeyBase64 == null) {
        // generate 32 bytes key
        final newKey = Key.fromSecureRandom(32);
        final newKeyBase64 = base64Url.encode(newKey.bytes);
        await _storage.write(key: _tokenEncKey, value: newKeyBase64);
        key = newKey;
      } else {
        final bytes = base64Url.decode(encKeyBase64);
        key = Key(bytes);
      }

      final iv = IV.fromSecureRandom(16);
      final encrypter = Encrypter(AES(key, mode: AESMode.cbc));
      final encrypted = encrypter.encrypt(token, iv: iv);
      final payload = '${base64Url.encode(iv.bytes)}:${encrypted.base64}';
      await _storage.write(key: _tokenKey, value: payload);
    } catch (e) {
      // fallback: store plain token if encryption fails
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  Future<String?> readToken() async {
    final raw = await _storage.read(key: _tokenKey);
    if (raw == null) return null;
    try {
      if (!raw.contains(':')) return raw; // plain token
      final parts = raw.split(':');
      if (parts.length != 2) return raw;
      final ivBytes = base64Url.decode(parts[0]);
      final cipherB64 = parts[1];
      final encKeyBase64 = await _storage.read(key: _tokenEncKey);
      if (encKeyBase64 == null) return null;
      final keyBytes = base64Url.decode(encKeyBase64);
      final key = Key(keyBytes);
      final iv = IV(ivBytes);
      final encrypter = Encrypter(AES(key, mode: AESMode.cbc));
      final decrypted = encrypter.decrypt64(cipherB64, iv: iv);
      return decrypted;
    } catch (e) {
      return raw;
    }
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Save a user object as a JSON string for quick access (non-sensitive)
  Future<void> saveUser(String json) async {
    await _storage.write(key: 'user_json', value: json);
  }

  Future<String?> readUser() async {
    return await _storage.read(key: 'user_json');
  }

  Future<void> deleteUser() async {
    await _storage.delete(key: 'user_json');
  }

  // Generic helpers for storing small JSON blobs (used for alarms/dismissed ids)
  Future<void> writeValue(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> readValue(String key) async {
    return await _storage.read(key: key);
  }
}
