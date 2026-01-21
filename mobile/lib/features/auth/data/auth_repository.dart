import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient.instance;
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    webOptions: WebOptions(dbName: 'UptimeMonitor', publicKey: 'UptimeMonitor'),
  );

  Future<bool> login(String username, String password) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.loginEndpoint,
        data: {'username': username, 'password': password},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        await _storage.write(key: 'auth_token', value: data['token']);
        await _storage.write(
          key: 'token_expires_at',
          value: data['expiresAt'].toString(),
        );
        await _storage.write(key: 'user_name', value: data['user']['name']);
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> sendOTP(String email) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.sendOTPEndpoint,
        data: {'email': email},
      );

      if (response.data['success'] == true) {
        return {
          'success': true,
          'isNewUser': response.data['isNewUser'] ?? false,
          'message': response.data['message'] ?? 'OTP sent successfully',
        };
      }

      return {
        'success': false,
        'error': response.data['error'] ?? 'Failed to send OTP',
      };
    } catch (e) {
      print('Send OTP error: $e');
      return {
        'success': false,
        'error': 'Failed to send OTP. Please try again.',
      };
    }
  }

  Future<Map<String, dynamic>> verifyOTP({
    required String email,
    required String code,
    String? name,
    String? organizationName,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.verifyOTPEndpoint,
        data: {
          'email': email,
          'code': code,
          if (name != null) 'name': name,
          if (organizationName != null) 'organizationName': organizationName,
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        await _storage.write(key: 'auth_token', value: data['token']);
        await _storage.write(
          key: 'token_expires_at',
          value: data['expiresAt'].toString(),
        );
        await _storage.write(key: 'user_name', value: data['user']['name']);

        return {'success': true, 'message': 'Login successful'};
      }

      return {
        'success': false,
        'error': response.data['error'] ?? 'Invalid OTP',
      };
    } catch (e) {
      print('Verify OTP error: $e');
      return {
        'success': false,
        'error': 'Failed to verify OTP. Please try again.',
      };
    }
  }

  Future<void> logout() async {
    try {
      await _storage.delete(key: 'auth_token');
      await _storage.delete(key: 'token_expires_at');
      await _storage.delete(key: 'user_name');
    } catch (e) {
      print('Logout error: $e');
    }
  }

  Future<bool> isAuthenticated() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      final expiresAtStr = await _storage.read(key: 'token_expires_at');

      print(
        'Auth check: token exists = ${token != null}, expiresAt = $expiresAtStr',
      );

      if (token == null || expiresAtStr == null) {
        print('Auth check: Missing token or expiry');
        return false;
      }

      final expiresAt = int.tryParse(expiresAtStr);
      if (expiresAt == null) {
        print('Auth check: Invalid expiry format');
        return false;
      }

      final now = DateTime.now().millisecondsSinceEpoch;
      print(
        'Auth check: now = $now, expiresAt = $expiresAt, expired = ${now > expiresAt}',
      );

      // Check if token is expired
      if (now > expiresAt) {
        print('Auth check: Token expired, logging out');
        await logout();
        return false;
      }

      print('Auth check: Token valid');
      return true;
    } catch (e) {
      print('Auth check error: $e');
      return false;
    }
  }

  Future<String?> getUserName() async {
    try {
      return await _storage.read(key: 'user_name');
    } catch (e) {
      return null;
    }
  }

  Future<String?> getToken() async {
    try {
      return await _storage.read(key: 'auth_token');
    } catch (e) {
      return null;
    }
  }
}
