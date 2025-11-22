// Factory for creating an `IOClient` that can accept self-signed certs in dev.
import 'dart:io';
import 'package:http/io_client.dart';
import '../config.dart';

IOClient createIOClient() {
  // Use a platform HttpClient (not available on web). If running on web,
  // callers should use the normal `http` package directly.
  final ioHttp = HttpClient();

  // Allow self-signed certificates for the configured host when enabled.
  if (allowSelfSignedCerts) {
    final host = Uri.parse(getBaseUrl()).host;
    ioHttp.badCertificateCallback = (X509Certificate cert, String host2, int port) {
      // Accept if the host matches the API host. In production set
      // `allowSelfSignedCerts` to false.
      if (host2 == host) return true;
      return false;
    };
  }

  return IOClient(ioHttp);
}
