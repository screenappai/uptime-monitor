import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../services/server_config_service.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _currentBaseUrl;

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // Token expired or invalid - will be handled by auth provider
          }
          return handler.next(error);
        },
      ),
    );
  }

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  String? get currentBaseUrl => _currentBaseUrl;

  /// Initialize the API client with the server URL from config
  Future<void> initialize() async {
    final url = await ServerConfigService.instance.getServerUrl();
    if (url != null) {
      setBaseUrl(url);
    }
  }

  /// Update the base URL for all API calls
  void setBaseUrl(String url) {
    _currentBaseUrl = url;
    _dio.options.baseUrl = url;
    print('ApiClient: Base URL set to $url');
  }

  /// Test connection to a server URL - verifies it's an Uptime Monitor server
  Future<bool> testConnection(String url) async {
    try {
      final testDio = Dio(
        BaseOptions(
          baseUrl: url,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      // Try the mobile auth endpoint with empty credentials
      // A valid Uptime Monitor server will return a specific error response
      final response = await testDio.post(
        '/api/auth/mobile',
        data: {'username': '', 'password': ''},
      );

      // Check if response has the expected structure
      return response.data is Map && response.data.containsKey('success');
    } on DioException catch (e) {
      // Check if the error response is from Uptime Monitor
      if (e.response != null && e.response?.data is Map) {
        final data = e.response?.data as Map;
        // Uptime Monitor returns {success: false, error: "..."} for invalid credentials
        if (data.containsKey('success') && data.containsKey('error')) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
  }
}
