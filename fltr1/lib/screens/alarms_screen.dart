import 'package:flutter/material.dart';
import '../services/messages_store.dart';
import '../services/alarms_service.dart';

class AlarmsScreen extends StatelessWidget {
  const AlarmsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = MessagesStore();
    final svc = alarmsService;
    return Scaffold(
      appBar: AppBar(title: const Text('Alarms')),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            const SizedBox(height: 32),
            Expanded(
              child: ValueListenableBuilder<List<Map<String, dynamic>>>(
                valueListenable: store.messages,
                builder: (context, messages, _) {
                  final alarms = svc.storedAlarms;
                  if (alarms.isEmpty) return const Center(child: Text('No alarms'));
                  return ListView.separated(
                    itemCount: alarms.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, idx) {
                      final m = alarms[idx];
                      final title = m['message'] ?? m['text'] ?? 'No message';
                      final created = m['__stored_at'] ?? m['created_at'] ?? m['datetime_alarm'] ?? '';
                      final sender = (m['sender_info'] is Map)
                          ? (m['sender_info']['name'] ?? '')
                          : (m['sender_info']?.toString() ?? (m['sender']?.toString() ?? ''));
                      return ListTile(
                        title: Text(title.toString()),
                        subtitle: Text('From: $sender\n$created'),
                        isThreeLine: true,
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
