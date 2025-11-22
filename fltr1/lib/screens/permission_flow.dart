import 'package:flutter/material.dart';
import 'permission_screen.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionFlow extends StatelessWidget {
  const PermissionFlow({super.key});

  Future<PermissionStatus> _requestNotifications() async {
    return await Permission.notification.request();
  }

  @override
  Widget build(BuildContext context) {
    return Navigator(
      onGenerateRoute: (settings) {
        return MaterialPageRoute(builder: (ctx) => PermissionScreen(
          title: 'Notifications Permission',
          body: 'We need permission to show notifications so you can receive alarms even when the app is not in the foreground.',
          onRequest: _requestNotifications,
        ));
      },
      pages: const [],
    );
  }
}
