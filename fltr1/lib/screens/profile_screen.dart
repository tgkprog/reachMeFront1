import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/poll_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
    final email = args != null ? (args['email'] ?? 'unknown') : 'unknown';
    final AuthService auth = AuthService();

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const SizedBox(height: 32),
            Text('Email: $email', style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                final navigator = Navigator.of(context);
                await auth.logout();
                // stop polling when user logs out
                try {
                  pollService.stop();
                } catch (_) {}
                navigator.popUntil((r) => r.isFirst);
              },
              child: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }
}
