import 'dart:io';
import 'package:flutter/foundation.dart';

class FileLogger {
  // Append a log line to the shared readme.txt used by the initial setup flow.
  // Accepts optional error and stackTrace to record full exception details.
  static Future<void> append(String line, {Object? error, StackTrace? stackTrace}) async {
    try {
      final path = Platform.isAndroid ? '/sdcard/readme.txt' : '${Directory.current.path}/readme.txt';
      final f = File(path);
      final ts = DateTime.now().toIso8601String();
      final buffer = StringBuffer();
      buffer.writeln('[$ts] $line');
      if (error != null) {
        buffer.writeln('  ERROR: ${error.toString()}');
      }
      if (stackTrace != null) {
        buffer.writeln('  STACKTRACE:');
        buffer.writeln(stackTrace.toString());
      }
      buffer.writeln('');
      await f.writeAsString(buffer.toString(), mode: FileMode.append, flush: true);
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('FileLogger.append failed: $e');
      }
    }
  }

  // Convenience helper to log exceptions with stack traces.
  static Future<void> appendException(Object error, StackTrace stackTrace, {String? context}) async {
    final msg = context ?? 'Exception';
    return append(msg, error: error, stackTrace: stackTrace);
  }
}
