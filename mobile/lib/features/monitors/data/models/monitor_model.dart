import 'package:json_annotation/json_annotation.dart';

part 'monitor_model.g.dart';

@JsonSerializable()
class MonitorModel {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String url;
  final String type;
  final int interval;
  final int timeout;
  final String status;
  final DateTime? lastCheck;
  final DateTime createdAt;
  final DateTime updatedAt;

  MonitorModel({
    required this.id,
    required this.name,
    required this.url,
    required this.type,
    required this.interval,
    required this.timeout,
    required this.status,
    this.lastCheck,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MonitorModel.fromJson(Map<String, dynamic> json) => _$MonitorModelFromJson(json);
  Map<String, dynamic> toJson() => _$MonitorModelToJson(this);

  bool get isUp => status == 'up';
  bool get isDown => status == 'down';
  bool get isPaused => status == 'paused';
}
