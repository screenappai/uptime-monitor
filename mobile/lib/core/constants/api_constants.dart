class ApiConstants {
  ApiConstants._();

  // Auth endpoints
  static const String loginEndpoint = '/api/auth/mobile';
  static const String sendOTPEndpoint = '/api/auth/send-otp';
  static const String verifyOTPEndpoint = '/api/auth/verify-otp';

  // Device endpoints
  static const String devicesEndpoint = '/api/devices';

  // Monitor endpoints
  static const String monitorsEndpoint = '/api/monitors';
  static String monitorEndpoint(String id) => '/api/monitors/$id';
  static String monitorStatsEndpoint(String id) => '/api/monitors/$id/stats';
  static String monitorChecksEndpoint(String id) => '/api/monitors/$id/checks';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
