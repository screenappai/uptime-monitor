import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 5,
    lineLength: 80,
    colors: true,
    dateTimeFormat: DateTimeFormat.none,
  ),
  level: kDebugMode ? Level.debug : Level.off,
);
