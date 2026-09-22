import 'dart:async';

import 'package:dio/dio.dart';

import 'token_store.dart';

/// Marks a request that must not carry (or refresh) a token — login, register,
/// refresh itself. Without it, a failed login would trigger a refresh attempt.
const String kSkipAuth = 'skipAuth';

/// Attaches the access token, and refreshes it once when the API says it has
/// expired.
///
/// Access tokens live 15 minutes, so an app left open for a nap comes back to a
/// dead token; that must not read as a logout. Refresh is **single-flight**: if
/// three screens all 401 at once they await one refresh call, rather than
/// racing three and having two of them invalidate the third.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.tokens,
    required this.refreshDio,
    required this.onSignedOut,
  });

  final TokenStore tokens;

  /// A bare Dio with no interceptors — refreshing through the interceptor that
  /// triggered the refresh is how you write an infinite loop.
  final Dio refreshDio;

  /// Called when the session is genuinely over: the refresh token is gone,
  /// expired, or has been revoked by a password reset / logout-all
  /// (`User.tokenVersion`). The app signs out and says why.
  final void Function() onSignedOut;

  Future<bool>? _inFlight;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.extra[kSkipAuth] != true) {
      final token = tokens.accessToken;
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    final isAuthFailure = err.response?.statusCode == 401;
    final alreadyRetried = options.extra['retried'] == true;

    if (!isAuthFailure ||
        alreadyRetried ||
        options.extra[kSkipAuth] == true ||
        tokens.refreshToken == null) {
      return handler.next(err);
    }

    final refreshed = await _refresh();
    if (!refreshed) {
      onSignedOut();
      return handler.next(err);
    }

    try {
      options.extra['retried'] = true;
      options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
      final response = await refreshDio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  Future<bool> _refresh() {
    return _inFlight ??= _doRefresh().whenComplete(() => _inFlight = null);
  }

  Future<bool> _doRefresh() async {
    final refreshToken = tokens.refreshToken;
    if (refreshToken == null) return false;
    try {
      final response = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data;
      if (data == null) return false;
      await tokens.save(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } on DioException {
      // A 401 here means the refresh token is dead — expired, or revoked
      // because `tokenVersion` was bumped by a password reset or logout-all.
      // Either way the session is over; anything else (a network blip) is
      // also not recoverable inside this request.
      await tokens.clear();
      return false;
    }
  }
}
