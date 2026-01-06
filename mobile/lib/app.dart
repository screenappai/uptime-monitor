import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/services/navigation_service.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/splash_screen.dart';
import 'features/monitors/presentation/screens/monitors_list_screen.dart';
import 'features/monitors/presentation/screens/monitor_details_screen.dart';
import 'features/settings/presentation/screens/server_config_screen.dart';
import 'features/settings/presentation/screens/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: NavigationService.instance.navigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/server-config',
        builder: (context, state) => const ServerConfigScreen(isInitialSetup: true),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/monitors',
        builder: (context, state) => const MonitorsListScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) => MonitorDetailsScreen(
              monitorId: state.pathParameters['id']!,
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
        routes: [
          GoRoute(
            path: 'server',
            builder: (context, state) => const ServerConfigScreen(isInitialSetup: false),
          ),
        ],
      ),
    ],
  );
});

class UptimeMonitorApp extends ConsumerWidget {
  const UptimeMonitorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Uptime Monitor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
