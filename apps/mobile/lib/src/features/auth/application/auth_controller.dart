import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/auth.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/token_store.dart';
import '../data/auth_repository.dart';

enum AuthStatus {
  /// Still reading the keychain and probing the stored session. The router
  /// holds on the splash rather than flashing the login screen at someone who
  /// is, in fact, signed in.
  unknown,
  signedOut,
  signedIn,
}

class AuthState {
  const AuthState({required this.status, this.user, this.message});

  final AuthStatus status;
  final AuthUser? user;

  /// A one-off explanation for why the app signed someone out — shown once on
  /// the login screen. Silently landing on login is the behaviour this avoids.
  final String? message;

  bool get isSignedIn => status == AuthStatus.signedIn;

  AuthState copyWith({AuthStatus? status, AuthUser? user, String? message}) =>
      AuthState(
        status: status ?? this.status,
        user: user ?? this.user,
        message: message,
      );

  static const unknown = AuthState(status: AuthStatus.unknown);
}

class AuthController extends Notifier<AuthState> {
  StreamSubscription<void>? _forcedSignOut;

  @override
  AuthState build() {
    final controller = ref.watch(forcedSignOutProvider);
    _forcedSignOut = controller.stream.listen((_) {
      // The interceptor exhausted its refresh; the session is genuinely over.
      _signOutLocally(
        'You were signed out. This can happen after a password change — please sign in again.',
      );
    });
    ref.onDispose(() => _forcedSignOut?.cancel());

    // Not awaited: `build` must return synchronously, and the router shows the
    // splash while the status is `unknown`.
    unawaited(_restore());
    return AuthState.unknown;
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);
  TokenStore get _tokens => ref.read(tokenStoreProvider);

  /// Launch path: load the keychain, then verify the session is still good.
  ///
  /// The probe matters — a stored token can be dead because the password was
  /// reset on the web, which bumps `tokenVersion`. Without it the app would
  /// look signed in until the first real request failed.
  Future<void> _restore() async {
    await _tokens.load();
    if (!_tokens.hasSession) {
      state = const AuthState(status: AuthStatus.signedOut);
      return;
    }
    try {
      final user = await _repo.me();
      state = AuthState(status: AuthStatus.signedIn, user: user);
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await _tokens.clear();
        state = const AuthState(status: AuthStatus.signedOut);
      } else {
        // A network failure is not a logout. Keep the session and let the app
        // in; the next request will retry and the UI will surface the error.
        state = AuthState(status: AuthStatus.signedIn, user: state.user);
      }
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    final res = await _repo.login(email: email.trim(), password: password);
    await _tokens.save(
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
    );
    state = AuthState(status: AuthStatus.signedIn, user: res.user);
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await _repo.register(
      name: name.trim(),
      email: email.trim(),
      password: password,
    );
    await _tokens.save(
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
    );
    state = AuthState(status: AuthStatus.signedIn, user: res.user);
  }

  Future<void> signOut() async {
    await _tokens.clear();
    state = const AuthState(status: AuthStatus.signedOut);
  }

  /// Revokes every session this user holds, here and on the web.
  Future<void> signOutEverywhere() async {
    try {
      await _repo.logoutEverywhere();
    } on ApiException {
      // The local session goes regardless — a failed revoke must not leave
      // someone still signed in on the device they are trying to sign out of.
    }
    await _tokens.clear();
    state = const AuthState(status: AuthStatus.signedOut);
  }

  Future<void> refreshUser() async {
    if (!state.isSignedIn) return;
    try {
      state = state.copyWith(user: await _repo.me());
    } on ApiException {
      // Leave the cached user in place; this is a background refresh.
    }
  }

  Future<void> _signOutLocally(String message) async {
    await _tokens.clear();
    state = AuthState(status: AuthStatus.signedOut, message: message);
  }

  /// Clears the one-off sign-out explanation once it has been shown.
  void clearMessage() {
    if (state.message != null) {
      state = AuthState(status: state.status, user: state.user);
    }
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);
