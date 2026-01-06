import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import 'models/monitor_model.dart';
import 'models/monitor_stats_model.dart';
import 'models/monitor_check_model.dart';

class MonitorsRepository {
  final ApiClient _apiClient = ApiClient.instance;

  Future<List<MonitorModel>> getMonitors() async {
    try {
      final response = await _apiClient.get(ApiConstants.monitorsEndpoint);

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => MonitorModel.fromJson(json)).toList();
      }
      throw Exception('Failed to load monitors');
    } catch (e) {
      throw Exception('Failed to load monitors: $e');
    }
  }

  Future<MonitorModel> getMonitor(String id) async {
    try {
      final response = await _apiClient.get(ApiConstants.monitorEndpoint(id));

      if (response.data['success'] == true) {
        return MonitorModel.fromJson(response.data['data']);
      }
      throw Exception('Failed to load monitor');
    } catch (e) {
      throw Exception('Failed to load monitor: $e');
    }
  }

  Future<MonitorStatsModel> getMonitorStats(String id) async {
    try {
      final response = await _apiClient.get(ApiConstants.monitorStatsEndpoint(id));

      if (response.data['success'] == true) {
        return MonitorStatsModel.fromJson(response.data['data']);
      }
      throw Exception('Failed to load monitor stats');
    } catch (e) {
      throw Exception('Failed to load monitor stats: $e');
    }
  }

  Future<List<MonitorCheckModel>> getMonitorChecks(
    String id, {
    int limit = 50,
    int? hours,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {'limit': limit};

      // Add time filtering
      if (hours != null) {
        queryParams['hours'] = hours;
      } else if (startDate != null) {
        queryParams['startDate'] = startDate.toUtc().toIso8601String();
        if (endDate != null) {
          queryParams['endDate'] = endDate.toUtc().toIso8601String();
        }
      }

      final response = await _apiClient.get(
        ApiConstants.monitorChecksEndpoint(id),
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => MonitorCheckModel.fromJson(json)).toList();
      }
      throw Exception('Failed to load monitor checks');
    } catch (e) {
      throw Exception('Failed to load monitor checks: $e');
    }
  }
}
