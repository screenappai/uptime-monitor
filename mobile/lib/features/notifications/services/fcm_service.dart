import 'dart:io';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/logger_service.dart';
import '../../../core/services/navigation_service.dart';

// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background message
  logger.d('Handling background message: ${message.messageId}');
}

class FCMService {
  static FCMService? _instance;
  static FCMService get instance => _instance ??= FCMService._();

  FCMService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> initialize() async {
    // Request permissions
    await _requestPermissions();

    // Enable foreground notifications on iOS
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) {
      _saveAndRegisterToken(token);
    });
  }

  Future<void> _requestPermissions() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    logger.i('FCM Authorization status: ${settings.authorizationStatus}');
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        // Handle notification tap from local notification
        if (response.payload != null) {
          _handleNotificationPayload(response.payload!);
        }
      },
    );

    // Create Android notification channel
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'monitor_alerts',
        'Monitor Alerts',
        description: 'Notifications for monitor status changes',
        importance: Importance.high,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    logger.d('Foreground message received: ${message.notification?.title}');
    logger.d('Message data: ${message.data}');

    // Show local notification when app is in foreground
    // Only needed on Android - iOS handles it via setForegroundNotificationPresentationOptions
    if (Platform.isAndroid && message.notification != null) {
      await _showLocalNotification(
        title: message.notification!.title ?? 'Uptime Monitor',
        body: message.notification!.body ?? '',
        payload: jsonEncode(message.data),
      );
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    logger.d('Notification tapped: ${message.data}');

    // Extract monitorId from notification data
    final data = message.data;
    if (data.containsKey('monitorId')) {
      final monitorId = data['monitorId'] as String;
      NavigationService.instance.navigateToMonitor(monitorId);
    } else {
      // If no specific monitor, just go to monitors list
      NavigationService.instance.navigateToMonitors();
    }
  }

  void _handleNotificationPayload(String payload) {
    try {
      logger.d('Handling notification payload: $payload');
      final data = jsonDecode(payload) as Map<String, dynamic>;

      if (data.containsKey('monitorId')) {
        final monitorId = data['monitorId'] as String;
        NavigationService.instance.navigateToMonitor(monitorId);
      } else {
        NavigationService.instance.navigateToMonitors();
      }
    } catch (e) {
      logger.e('Error parsing notification payload', error: e);
      NavigationService.instance.navigateToMonitors();
    }
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'monitor_alerts',
      'Monitor Alerts',
      channelDescription: 'Notifications for monitor status changes',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: payload,
    );
  }

  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      logger.e('Error getting FCM token', error: e);
      return null;
    }
  }

  Future<void> registerDeviceToken() async {
    logger.d('FCM: Starting device token registration...');
    final token = await getToken();
    if (token != null) {
      logger.d('FCM: Got token: $token');
      await _saveAndRegisterToken(token);
    } else {
      logger.w('FCM: Failed to get FCM token');
    }
  }

  Future<void> _saveAndRegisterToken(String token) async {
    // Save token locally using SharedPreferences (FCM token is not sensitive)
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_token', token);
    logger.d('FCM: Token saved locally');

    // Register with backend
    try {
      final authToken = await _storage.read(key: 'auth_token');
      logger.d('FCM: Auth token exists: ${authToken != null}');
      if (authToken != null) {
        logger.d('FCM: Sending token to ${ApiConstants.devicesEndpoint}...');
        final response = await ApiClient.instance.post(
          ApiConstants.devicesEndpoint,
          data: {
            'token': token,
            'platform': Platform.isIOS ? 'ios' : 'android',
          },
        );
        logger.d('FCM: Backend response: ${response.statusCode} - ${response.data}');
        logger.i('FCM: Token registered with backend successfully');
      } else {
        logger.w('FCM: No auth token found, skipping backend registration');
      }
    } catch (e) {
      logger.e('FCM: Error registering token with backend', error: e);
    }
  }

  Future<void> unregisterDeviceToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('fcm_token');
      if (token != null) {
        await ApiClient.instance.delete(
          ApiConstants.devicesEndpoint,
          data: {'token': token},
        );
        await prefs.remove('fcm_token');
        logger.i('FCM token unregistered from backend');
      }
    } catch (e) {
      logger.e('Error unregistering FCM token', error: e);
    }
  }
}
