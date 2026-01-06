import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NavigationService {
  static final NavigationService instance = NavigationService._();
  NavigationService._();

  GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  BuildContext? get context => navigatorKey.currentContext;

  void navigateToMonitor(String monitorId) {
    if (context != null) {
      context!.go('/monitors/$monitorId');
    }
  }

  void navigateToMonitors() {
    if (context != null) {
      context!.go('/monitors');
    }
  }
}
