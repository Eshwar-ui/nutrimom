import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/auth.dart';
import '../../../core/network/api_client.dart';

/// Every call the auth surface makes, in one place.
class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      body: {'email': email, 'password': password},
      authed: false,
    );
    return AuthResponse.fromJson(json);
  }

  Future<AuthResponse> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/auth/register',
      body: {'name': name, 'email': email, 'password': password},
      authed: false,
    );
    return AuthResponse.fromJson(json);
  }

  /// Also the session probe on launch: a 401 here means the stored refresh
  /// token could not be exchanged, so the session is over.
  Future<AuthUser> me() async {
    final json = await _api.get<Map<String, dynamic>>('/users/me');
    return AuthUser.fromJson(json);
  }

  Future<AuthUser> updateProfile({
    String? name,
    String? whatsappNumber,
    String? city,
    String? bio,
  }) async {
    final json = await _api.patch<Map<String, dynamic>>(
      '/users/me',
      body: {
        'name': ?name,
        'whatsappNumber': ?whatsappNumber,
        'city': ?city,
        'bio': ?bio,
      },
    );
    return AuthUser.fromJson(json);
  }

  /// Always 200, whether or not the address exists — the API deliberately does
  /// not confirm which emails are registered, so neither does the app.
  Future<void> forgotPassword(String email) async {
    await _api.post<Map<String, dynamic>>(
      '/auth/forgot-password',
      body: {'email': email},
      authed: false,
    );
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await _api.post<Map<String, dynamic>>(
      '/auth/reset-password',
      body: {'token': token, 'password': password},
      authed: false,
    );
  }

  /// Bumps `User.tokenVersion` server-side, which kills every refresh token
  /// this user holds — including the one in this app.
  Future<void> logoutEverywhere() async {
    await _api.post<Map<String, dynamic>>('/auth/logout-all');
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});
