import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/monitors_repository.dart';
import '../../data/models/monitor_model.dart';
import '../../data/models/monitor_stats_model.dart';
import '../../data/models/monitor_check_model.dart';

// Repository provider
final monitorsRepositoryProvider = Provider<MonitorsRepository>((ref) {
  return MonitorsRepository();
});

// Monitors list provider
final monitorsProvider = FutureProvider<List<MonitorModel>>((ref) async {
  final repository = ref.watch(monitorsRepositoryProvider);
  return repository.getMonitors();
});

// Single monitor provider
final monitorProvider = FutureProvider.family<MonitorModel, String>((ref, id) async {
  final repository = ref.watch(monitorsRepositoryProvider);
  return repository.getMonitor(id);
});

// Monitor stats provider
final monitorStatsProvider = FutureProvider.family<MonitorStatsModel, String>((ref, id) async {
  final repository = ref.watch(monitorsRepositoryProvider);
  return repository.getMonitorStats(id);
});

// Monitor checks provider (basic - for backwards compatibility)
final monitorChecksProvider = FutureProvider.family<List<MonitorCheckModel>, String>((ref, id) async {
  final repository = ref.watch(monitorsRepositoryProvider);
  return repository.getMonitorChecks(id);
});

// Parameters for filtered checks
class ChecksFilterParams {
  final String monitorId;
  final int? hours;
  final DateTime? startDate;
  final DateTime? endDate;
  final int limit;

  const ChecksFilterParams({
    required this.monitorId,
    this.hours,
    this.startDate,
    this.endDate,
    this.limit = 500,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ChecksFilterParams &&
          runtimeType == other.runtimeType &&
          monitorId == other.monitorId &&
          hours == other.hours &&
          startDate == other.startDate &&
          endDate == other.endDate &&
          limit == other.limit;

  @override
  int get hashCode =>
      monitorId.hashCode ^
      hours.hashCode ^
      startDate.hashCode ^
      endDate.hashCode ^
      limit.hashCode;
}

// Filtered monitor checks provider
final filteredMonitorChecksProvider = FutureProvider.family<List<MonitorCheckModel>, ChecksFilterParams>((ref, params) async {
  final repository = ref.watch(monitorsRepositoryProvider);
  return repository.getMonitorChecks(
    params.monitorId,
    hours: params.hours,
    startDate: params.startDate,
    endDate: params.endDate,
    limit: params.limit,
  );
});

// Summary stats
class MonitorsSummary {
  final int total;
  final int up;
  final int down;
  final int paused;

  MonitorsSummary({
    required this.total,
    required this.up,
    required this.down,
    required this.paused,
  });
}

final monitorsSummaryProvider = Provider<MonitorsSummary>((ref) {
  final monitorsAsync = ref.watch(monitorsProvider);

  return monitorsAsync.when(
    data: (monitors) {
      return MonitorsSummary(
        total: monitors.length,
        up: monitors.where((m) => m.isUp).length,
        down: monitors.where((m) => m.isDown).length,
        paused: monitors.where((m) => m.isPaused).length,
      );
    },
    loading: () => MonitorsSummary(total: 0, up: 0, down: 0, paused: 0),
    error: (_, __) => MonitorsSummary(total: 0, up: 0, down: 0, paused: 0),
  );
});
