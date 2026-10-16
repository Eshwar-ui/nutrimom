import 'package:dio/dio.dart';

/// Every failure the app surfaces to a person, in one shape.
///
/// The API's `AllExceptionsFilter` already guarantees that a 5xx carries a
/// generic message rather than a stack or ORM text, so anything in [message]
/// is safe to show. A 4xx carries the server's own wording, which is written
/// for the person reading it (the shared Zod schemas all have friendly
/// messages) — so it is shown verbatim rather than being re-worded here.
class ApiException implements Exception {
  ApiException({required this.message, this.statusCode, this.cause});

  final String message;
  final int? statusCode;
  final Object? cause;

  /// No response at all — airplane mode, dead wifi, a captive portal.
  bool get isNetwork => statusCode == null;
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;
    if (response == null) {
      return ApiException(
        message: switch (e.type) {
          DioExceptionType.connectionTimeout ||
          DioExceptionType.sendTimeout ||
          DioExceptionType.receiveTimeout =>
            'That took too long. Check your connection and try again.',
          DioExceptionType.cancel => 'Cancelled.',
          _ => "We couldn't reach The Nurture Moms. Check your connection and try again.",
        },
        cause: e,
      );
    }
    return ApiException(
      message:
          _message(response.data) ?? 'Something went wrong. Please try again.',
      statusCode: response.statusCode,
      cause: e,
    );
  }

  /// Nest sends `message` as either a string or an array of strings (one per
  /// failed validation rule). Both are joined into something a person can read.
  static String? _message(Object? data) {
    if (data is Map) {
      final m = data['message'];
      if (m is String && m.trim().isNotEmpty) return m;
      if (m is List && m.isNotEmpty) {
        return m.map((e) => e.toString()).join('\n');
      }
      final err = data['error'];
      if (err is String && err.trim().isNotEmpty) return err;
    }
    if (data is String && data.trim().isNotEmpty) return data;
    return null;
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}
