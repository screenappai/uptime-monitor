import 'package:json_annotation/json_annotation.dart';

part 'monitor_check_model.g.dart';

@JsonSerializable()
class MonitorCheckModel {
  @JsonKey(name: '_id')
  final String id;
  final String monitorId;
  final bool success;
  final int responseTime;
  final int? statusCode;
  final String? error;
  final DateTime timestamp;
  final int? attemptNumber;

  MonitorCheckModel({
    required this.id,
    required this.monitorId,
    required this.success,
    required this.responseTime,
    this.statusCode,
    this.error,
    required this.timestamp,
    this.attemptNumber,
  });

  factory MonitorCheckModel.fromJson(Map<String, dynamic> json) => _$MonitorCheckModelFromJson(json);
  Map<String, dynamic> toJson() => _$MonitorCheckModelToJson(this);
}
