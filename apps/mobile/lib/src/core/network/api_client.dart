import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'api_exception.dart';
import 'auth_interceptor.dart';
import 'token_store.dart';

/// Broadcast when the API has told us the session is over, so the app can sign
/// out from wherever it happens to be. A stream rather than a direct call
/// because the interceptor lives below the state layer and must not depend
/// upward on it.
final forcedSignOutProvider = Provider<StreamController<void>>((ref) {
  final controller = StreamController<void>.broadcast();
  ref.onDispose(controller.close);
  return controller;
});

/// The one HTTP client. Every request in the app goes through it, so the auth
/// header, the refresh dance and the error shape are defined once.
class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    bool authed = true,
  }) => _send<T>(
    () => _dio.get<T>(path, queryParameters: query, options: _opts(authed)),
  );

  Future<T> post<T>(String path, {Object? body, bool authed = true}) =>
      _send<T>(() => _dio.post<T>(path, data: body, options: _opts(authed)));

  Future<T> patch<T>(String path, {Object? body, bool authed = true}) =>
      _send<T>(() => _dio.patch<T>(path, data: body, options: _opts(authed)));

  Future<T> delete<T>(String path, {Object? body, bool authed = true}) =>
      _send<T>(() => _dio.delete<T>(path, data: body, options: _opts(authed)));

  Options _opts(bool authed) =>
      Options(extra: authed ? null : {kSkipAuth: true});

  Future<T> _send<T>(Future<Response<T>> Function() request) async {
    try {
      final response = await request();
      final data = response.data;
      if (data == null) {
        throw ApiException(
          message: 'The server returned an empty response.',
          statusCode: response.statusCode,
        );
      }
      return data;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokens = ref.watch(tokenStoreProvider);
  final signOut = ref.watch(forcedSignOutProvider);

  final base = BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: AppConfig.connectTimeout,
    receiveTimeout: AppConfig.receiveTimeout,
    contentType: Headers.jsonContentType,
    // The API's own validation errors are the useful ones; let them through as
    // responses rather than as transport failures.
    validateStatus: (status) => status != null && status >= 200 && status < 300,
  );

  final dio = Dio(base);
  final refreshDio = Dio(base);

  dio.interceptors.add(
    AuthInterceptor(
      tokens: tokens,
      refreshDio: refreshDio,
      onSignedOut: () {
        if (!signOut.isClosed) signOut.add(null);
      },
    ),
  );

  ref.onDispose(() {
    dio.close();
    refreshDio.close();
  });

  return ApiClient(dio);
});
