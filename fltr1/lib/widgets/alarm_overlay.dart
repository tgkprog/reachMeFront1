import 'package:flutter/material.dart';
import '../services/alarms_service.dart';

class AlarmOverlay extends StatefulWidget {
  const AlarmOverlay({super.key});

  @override
  State<AlarmOverlay> createState() => _AlarmOverlayState();
}

class _AlarmOverlayState extends State<AlarmOverlay> {
  @override
  void initState() {
    super.initState();
    alarmsService.currentAlarm.addListener(_onAlarm);
  }

  @override
  void dispose() {
    alarmsService.currentAlarm.removeListener(_onAlarm);
    super.dispose();
  }

  void _onAlarm() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final alarm = alarmsService.currentAlarm.value;
    if (alarm == null) return const SizedBox.shrink();

    final sender = alarm['sender'] ?? alarm['from'] ?? 'Unknown';
    final when = alarm['created_at'] ?? alarm['datetime_alarm'] ?? '';
    final message = (alarm['message'] ?? alarm['text'] ?? '').toString();
    final phone = alarm['phone'] ?? '';

    return Positioned(
      left: 16,
      right: 16,
      bottom: 24,
      child: Material(
        elevation: 12,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Alarm from $sender', style: const TextStyle(fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      alarmsService.dismissCurrent();
                    },
                  )
                ],
              ),
              const SizedBox(height: 6),
              Text('When: $when', style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 180),
                child: SingleChildScrollView(child: Text(message)),
              ),
              if (phone != null && phone.toString().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Phone: $phone', style: const TextStyle(fontWeight: FontWeight.w500)),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
