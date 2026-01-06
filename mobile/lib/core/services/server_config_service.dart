import 'package:shared_preferences/shared_preferences.dart';

class ServerConfigService {
  static const String _serverUrlKey = 'server_url';

  static ServerConfigService? _instance;
  static ServerConfigService get instance => _instance ??= ServerConfigService._();

  ServerConfigService._();

  Future<bool> hasServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final url = prefs.getString(_serverUrlKey);
    return url != null && url.isNotEmpty;
  }

  Future<String?> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_serverUrlKey);
  }

  Future<void> setServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    // Remove trailing slash if present
    final cleanUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    await prefs.setString(_serverUrlKey, cleanUrl);
  }

  Future<void> clearServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_serverUrlKey);
  }

  bool isValidUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https') && uri.host.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
