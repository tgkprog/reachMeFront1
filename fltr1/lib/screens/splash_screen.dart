import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../services/poll_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final StorageService _storage = StorageService();

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final userJson = await _storage.readUser();
      if (userJson != null) {
        final Map<String, dynamic> user = jsonDecode(userJson);
        final email = user['email'] ?? 'unknown';
        // Start polling messages automatically and navigate to permission flow
        try {
          pollService.startPeriodic(const Duration(seconds: 10));
        } catch (_) {}
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/permissions', arguments: {'email': email});
        return;
      }
    } catch (_) {
      // ignore parse errors
    }

    // No user, continue to home
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/');
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Padding(
        padding: EdgeInsets.only(top: 32.0),
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
