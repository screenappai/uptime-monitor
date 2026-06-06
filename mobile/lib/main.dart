import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app.dart';
import 'features/notifications/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Start the app immediately. FCM initialization must NOT block startup:
  // some messaging calls (e.g. getInitialMessage / setForegroundNotification
  // PresentationOptions) wait on an APNS token that may never arrive on the
  // iOS simulator, which would otherwise leave a blank white screen.
  runApp(
    const ProviderScope(
      child: UptimeMonitorApp(),
    ),
  );

  // Initialize FCM in the background; failures here should never crash or
  // block the UI.
  FCMService.instance.initialize();
}
