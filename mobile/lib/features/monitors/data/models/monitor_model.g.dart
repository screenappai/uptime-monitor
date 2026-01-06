// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'monitor_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MonitorModel _$MonitorModelFromJson(Map<String, dynamic> json) => MonitorModel(
  id: json['_id'] as String,
  name: json['name'] as String,
  url: json['url'] as String,
  type: json['type'] as String,
  interval: (json['interval'] as num).toInt(),
  timeout: (json['timeout'] as num).toInt(),
  status: json['status'] as String,
  lastCheck: json['lastCheck'] == null
      ? null
      : DateTime.parse(json['lastCheck'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$MonitorModelToJson(MonitorModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'url': instance.url,
      'type': instance.type,
      'interval': instance.interval,
      'timeout': instance.timeout,
      'status': instance.status,
      'lastCheck': instance.lastCheck?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
