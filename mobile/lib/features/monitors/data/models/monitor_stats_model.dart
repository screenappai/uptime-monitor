import 'package:json_annotation/json_annotation.dart';

part 'monitor_stats_model.g.dart';

@JsonSerializable()
class MonitorStatsModel {
  final String monitorId;
  final double uptime24h;
  final double uptime7d;
  final double uptime30d;
  final double avgResponseTime;
  final int totalChecks;
  final int successfulChecks;
  final int failedChecks;
  final DateTime lastUpdated;

  MonitorStatsModel({
    required this.monitorId,
    required this.uptime24h,
    required this.uptime7d,
    required this.uptime30d,
    required this.avgResponseTime,
    required this.totalChecks,
    required this.successfulChecks,
    required this.failedChecks,
    required this.lastUpdated,
  });

  factory MonitorStatsModel.fromJson(Map<String, dynamic> json) => _$MonitorStatsModelFromJson(json);
  Map<String, dynamic> toJson() => _$MonitorStatsModelToJson(this);
}
