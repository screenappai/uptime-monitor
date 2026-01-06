// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'monitor_stats_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MonitorStatsModel _$MonitorStatsModelFromJson(Map<String, dynamic> json) =>
    MonitorStatsModel(
      monitorId: json['monitorId'] as String,
      uptime24h: (json['uptime24h'] as num).toDouble(),
      uptime7d: (json['uptime7d'] as num).toDouble(),
      uptime30d: (json['uptime30d'] as num).toDouble(),
      avgResponseTime: (json['avgResponseTime'] as num).toDouble(),
      totalChecks: (json['totalChecks'] as num).toInt(),
      successfulChecks: (json['successfulChecks'] as num).toInt(),
      failedChecks: (json['failedChecks'] as num).toInt(),
      lastUpdated: DateTime.parse(json['lastUpdated'] as String),
    );

Map<String, dynamic> _$MonitorStatsModelToJson(MonitorStatsModel instance) =>
    <String, dynamic>{
      'monitorId': instance.monitorId,
      'uptime24h': instance.uptime24h,
      'uptime7d': instance.uptime7d,
      'uptime30d': instance.uptime30d,
      'avgResponseTime': instance.avgResponseTime,
      'totalChecks': instance.totalChecks,
      'successfulChecks': instance.successfulChecks,
      'failedChecks': instance.failedChecks,
      'lastUpdated': instance.lastUpdated.toIso8601String(),
    };
