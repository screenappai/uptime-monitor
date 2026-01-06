import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../notifications/services/fcm_service.dart';
import '../../../../core/services/server_config_service.dart';
import '../../../../core/network/api_client.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkConfigAndNavigate();
  }

  Future<void> _checkConfigAndNavigate() async {
    await Future.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;

    // First check if server URL is configured
    final hasServerUrl = await ServerConfigService.instance.hasServerUrl();
    print('Splash: hasServerUrl = $hasServerUrl');

    if (!hasServerUrl) {
      // No server URL configured, go to server config screen
      print('Splash: Navigating to /server-config');
      if (mounted) context.go('/server-config');
      return;
    }

    // Initialize API client with stored URL
    await ApiClient.instance.initialize();

    if (!mounted) return;

    // Update auth provider state from persisted storage
    await ref.read(authProvider.notifier).checkAuthStatus();

    if (!mounted) return;

    final authState = ref.read(authProvider);
    print('Splash: isAuthenticated = ${authState.isAuthenticated}, mounted = $mounted');

    if (authState.isAuthenticated) {
      // Re-register FCM token on app start if authenticated
      await FCMService.instance.registerDeviceToken();
      print('Splash: Navigating to /monitors');
      if (mounted) context.go('/monitors');
    } else {
      print('Splash: Navigating to /login');
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.monitor_heart,
              size: 80,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'Uptime Monitor',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
