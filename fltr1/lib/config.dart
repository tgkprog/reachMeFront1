import 'package:flutter_dotenv/flutter_dotenv.dart';

// Application configuration
// `baseUrl` should NOT include a trailing slash. Use `buildUrl` to safely
// construct endpoints using `Uri.resolve` so accidental slashes are handled.

String getBaseUrl() {
	// Use the Flutter env key if dotenv was successfully initialized.
	// In some flows (early startup, tests) dotenv may not be loaded; in
	// that case fall back to the default production URL.
	final envVal = dotenv.isInitialized ? dotenv.env['API_BASE_URL'] : null;
	if (envVal != null && envVal.isNotEmpty) return envVal;
	return 'https://reachme2.com:8052';
}

String buildUrl(String path) {
	final baseUrl = getBaseUrl();
	final base = Uri.parse(baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl);
	final rel = path.startsWith('/') ? path : '/$path';
	return base.resolve(rel).toString();
}

String pingUrl() => buildUrl('/ping');

// Match the web client which posts password login to `/user/login`
String loginUrl() => buildUrl('/user/login');

String messagesUrl() => buildUrl('/api/reachme/messages');

// Allow self-signed certs when true. Set to false in production builds.
bool get allowSelfSignedCerts {
	final env = dotenv.isInitialized ? dotenv.env['ALLOW_SELF_SIGNED_CERTS'] : null;
	if (env == null) return true; // default to true in dev
	return env.toLowerCase() == 'true';
}

// If you need different endpoints for dev, change values in your .env files.
