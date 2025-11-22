import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/poll_service.dart';
import '../services/file_logger.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final AuthService _auth = AuthService();
  // ping result intentionally not stored in a dedicated field
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _pwCtrl = TextEditingController();
  bool _loading = false;
  final List<String> _log = [];

  void _append(String s) {
    setState(() {
      _log.insert(0, s);
    });
  }

  Future<void> _doPing() async {
    setState(() => _loading = true);
    try {
      final res = await _auth.ping();
      _append('Ping OK: $res');
    } catch (e, st) {
      _append('Ping error: $e');
      // also persist to device log for debugging (include stack trace)
      await FileLogger.append('Ping error', error: e, stackTrace: st);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _doLogin() async {
    final email = _emailCtrl.text.trim();
    final pw = _pwCtrl.text;
    if (email.isEmpty || pw.isEmpty) {
      _append('Please enter email and password');
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await _auth.passwordLogin(email, pw);
      final user = data['user'] as Map<String, dynamic>?;
      final emailResp = user != null ? (user['email'] ?? email) : email;
      _append('Login success: $emailResp');
      // Start polling messages every 10 seconds (fetch alarms/messages)
      try {
        pollService.startPeriodic(const Duration(seconds: 10));
      } catch (_) {}

      // Remain on Home screen after login. Permission flow should be
      // completed before login (InitialScreen). Do not navigate to
      // permissions here.
    } catch (e, st) {
      _append('Login failed: $e');
      await FileLogger.append('Login failed', error: e, stackTrace: st);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _goAlarms() {
    Navigator.of(context).pushNamed('/alarms');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ReachMe'), actions: [IconButton(onPressed: _goAlarms, icon: const Icon(Icons.alarm))]),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            const SizedBox(height: 32),
            Row(
              children: [
                ElevatedButton(onPressed: _loading ? null : _doPing, child: const Text('Ping Server')),
                const SizedBox(width: 8),
                if (_loading) const CircularProgressIndicator()
              ],
            ),

            const SizedBox(height: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(border: Border.all(color: Colors.grey), borderRadius: BorderRadius.circular(6)),
                child: Scrollbar(
                  child: SingleChildScrollView(
                    reverse: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _log.map((l) => Text(l)).toList(),
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 8),
            TextField(controller: _pwCtrl, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: ElevatedButton(onPressed: _loading ? null : _doLogin, child: const Text('Login'))),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
