// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'monitor_check_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MonitorCheckModel _$MonitorCheckModelFromJson(Map<String, dynamic> json) =>
    MonitorCheckModel(
      id: json['_id'] as String,
      monitorId: json['monitorId'] as String,
      success: json['success'] as bool,
      responseTime: (json['responseTime'] as num).toInt(),
      statusCode: (json['statusCode'] as num?)?.toInt(),
      error: json['error'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
      attemptNumber: (json['attemptNumber'] as num?)?.toInt(),
    );

Map<String, dynamic> _$MonitorCheckModelToJson(MonitorCheckModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'monitorId': instance.monitorId,
      'success': instance.success,
      'responseTime': instance.responseTime,
      'statusCode': instance.statusCode,
      'error': instance.error,
      'timestamp': instance.timestamp.toIso8601String(),
      'attemptNumber': instance.attemptNumber,
    };
