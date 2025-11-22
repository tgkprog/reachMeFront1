import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'screens/initial_screen.dart';
import 'screens/home_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/alarms_screen.dart';
import 'screens/permission_flow_screen.dart';
import 'services/alarms_service.dart';
import 'services/token_service.dart';
import 'widgets/alarm_overlay.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load environment file; prefer .env.local for local dev
  try {
    await dotenv.load(fileName: '.env.local');
  } catch (e) {
    // If .env.local is missing or fails to load, continue with defaults.
    // This avoids crashing on devices that don't have a local env file.
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReachMe',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
      initialRoute: '/init',
      builder: (context, child) {
        // Ensure alarmsService is initialized once
        alarmsService.init();
        // Ensure tokenService schedules a proactive refresh if token present
        tokenService.init();
        return Stack(children: [if (child != null) child, const AlarmOverlay()]);
      },
      routes: {
        '/init': (context) => const InitialScreen(),
        '/splash': (context) => const SplashScreen(),
        '/': (context) => const HomeScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/alarms': (context) => const AlarmsScreen(),
        '/permissions': (context) => const PermissionFlowScreen(),
      },
    );
  }
}
