import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// Build-time configuration.
///
/// Everything here comes from `--dart-define` so a build is pinned to one
/// environment rather than picking one up at runtime — see README for the
/// flags. The defaults point at the local dev stack (web 1122, api 1133,
/// matching `.claude/launch.json` and `apps/api/.env`).
class AppConfig {
  const AppConfig._();

  static const String _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _webBaseUrl = String.fromEnvironment('WEB_BASE_URL');

  /// The API origin.
  ///
  /// An Android emulator reaches the host machine on 10.0.2.2, not localhost —
  /// without this special case every debug build on Android fails to connect
  /// and looks like a broken backend.
  static String get apiBaseUrl {
    if (_apiBaseUrl.isNotEmpty) return _apiBaseUrl;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:1133';
    return 'http://localhost:1133';
  }

  /// The web app origin.
  ///
  /// Used for the surfaces the app deliberately hands back to the browser:
  /// seller registration and membership purchase (PRD decision D4).
  static String get webBaseUrl {
    if (_webBaseUrl.isNotEmpty) return _webBaseUrl;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:1122';
    return 'http://localhost:1122';
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
