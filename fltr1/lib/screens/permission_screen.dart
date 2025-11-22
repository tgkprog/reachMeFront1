import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

typedef PermissionRequest = Future<PermissionStatus> Function();

class PermissionScreen extends StatelessWidget {
  final String title;
  final String body;
  final PermissionRequest onRequest;

  const PermissionScreen({super.key, required this.title, required this.body, required this.onRequest});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(body, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }
}
