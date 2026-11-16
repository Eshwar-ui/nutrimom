import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// Build-time configuration.
///
/// Everything here comes from `--dart-define` so a build is pinned to one
/// environment rather than picking one up at runtime — see README for the
/// flags. Release builds fall back to the live origins; debug builds use the
/// local stack (web 1122, api 1133).
class AppConfig {
  const AppConfig._();

  static const String _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _webBaseUrl = String.fromEnvironment('WEB_BASE_URL');
  static const String _productionApiBaseUrl =
      'https://nutrimom-api.onrender.com';
  static const String _productionWebBaseUrl = 'https://www.thenurturemoms.com';

  /// The API origin.
  ///
  /// An Android emulator reaches the host machine on 10.0.2.2, not localhost —
  /// without this special case every debug build on Android fails to connect
  /// and looks like a broken backend.
  static String get apiBaseUrl {
    if (_apiBaseUrl.isNotEmpty) return _apiBaseUrl;
    // A physical phone resolves localhost to itself. Falling back to the local
    // dev server in a release build therefore makes every API-backed feature
    // (including sign-in) look broken when a release is installed without
    // --dart-define. Keep local defaults for development, but make an ordinary
    // release build safe to install directly on a real device.
    if (kReleaseMode) return _productionApiBaseUrl;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:1133';
    return 'http://localhost:1133';
  }

  /// The web app origin.
  ///
  /// Used for the surfaces the app deliberately hands back to the browser:
  /// seller registration and membership purchase (PRD decision D4).
  static String get webBaseUrl {
    if (_webBaseUrl.isNotEmpty) return _webBaseUrl;
    if (kReleaseMode) return _productionWebBaseUrl;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:1122';
    return 'http://localhost:1122';
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
