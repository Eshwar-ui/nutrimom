import '../enums.dart';

/// Mirror of `AuthUser` in `packages/shared`.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.whatsappNumber,
    this.city,
    this.bio,
    required this.isSellerVerified,
    this.sellerVerificationRequestedAt,
    this.registrationPaidAt,
  });

  final String id;
  final String name;
  final String email;
  final Role role;
  final String? whatsappNumber;
  final String? city;
  final String? bio;
  final bool isSellerVerified;
  final DateTime? sellerVerificationRequestedAt;

  /// Null until the ₹100 registration fee is paid. Drives whether the seller
  /// surfaces appear at all — the web `account-shell.tsx` uses the same rule.
  final DateTime? registrationPaidAt;

  bool get hasRegistered => registrationPaidAt != null;
  bool get isAdmin => role == Role.admin;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as String,
    name: json['name'] as String,
    email: json['email'] as String,
    role: Role.parse(json['role'] as String),
    whatsappNumber: json['whatsappNumber'] as String?,
    city: json['city'] as String?,
    bio: json['bio'] as String?,
    isSellerVerified: json['isSellerVerified'] as bool? ?? false,
    sellerVerificationRequestedAt: _date(json['sellerVerificationRequestedAt']),
    registrationPaidAt: _date(json['registrationPaidAt']),
  );

  static DateTime? _date(Object? v) =>
      v is String ? DateTime.tryParse(v)?.toLocal() : null;
}

/// Mirror of `AuthTokens`.
class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  final String accessToken;
  final String refreshToken;

  factory AuthTokens.fromJson(Map<String, dynamic> json) => AuthTokens(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
  );
}

/// Mirror of `AuthResponse`.
class AuthResponse {
  const AuthResponse({required this.user, required this.tokens});

  final AuthUser user;
  final AuthTokens tokens;

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
  );
}
