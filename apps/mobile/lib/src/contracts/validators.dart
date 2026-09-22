/// Client-side validation, worded identically to the Zod schemas in
/// `packages/shared`.
///
/// The server validates regardless — this exists so a person is told about a
/// short password before a round trip, not so the check can be skipped. The
/// wording is copied rather than invented: being told "Use at least 8
/// characters" by the app and something different by the server reads as two
/// different products.
library;

String? validateName(String? value) {
  final v = (value ?? '').trim();
  if (v.length < 2) return 'Enter your full name';
  if (v.length > 80) return 'That name is too long';
  return null;
}

/// Deliberately permissive, matching Zod's `.email()`: the authoritative check
/// is whether the address can receive the mail we send it.
final _email = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String? validateEmail(String? value) {
  final v = (value ?? '').trim();
  if (!_email.hasMatch(v)) return 'Enter a valid email address';
  return null;
}

String? validateNewPassword(String? value) {
  final v = value ?? '';
  if (v.length < 8) return 'Use at least 8 characters';
  if (v.length > 72) return 'That password is too long';
  return null;
}

String? validateExistingPassword(String? value) {
  if ((value ?? '').isEmpty) return 'Enter your password';
  return null;
}

/// Mirrors `phoneNumberSchema`: strip spaces, hyphens and parens, drop a
/// leading `+`, then require 10–15 digits. Empty is allowed — the profile
/// schema treats a blank as "not set", not as invalid.
String? validateWhatsappNumber(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return null;
  final normalized = v
      .replaceAll(RegExp(r'[\s\-()]'), '')
      .replaceFirst(RegExp(r'^\+'), '');
  if (!RegExp(r'^\d{10,15}$').hasMatch(normalized)) {
    return 'Enter a valid phone number, e.g. +91 98765 43210';
  }
  return null;
}

/// Mirrors `indianMobileNumberSchema`, used where delivery is involved.
String? validateIndianMobile(String? value) {
  final v = (value ?? '').trim();
  final normalized = v.replaceAll(RegExp(r'[\s\-()]'), '');
  if (!RegExp(r'^(?:\+91)?[6-9]\d{9}$').hasMatch(normalized)) {
    return 'Enter a valid 10-digit Indian mobile number';
  }
  return null;
}

String? validateCity(String? value) {
  if ((value ?? '').trim().length > 80) return 'That city name is too long';
  return null;
}

String? validateBio(String? value) {
  if ((value ?? '').trim().length > 400) {
    return 'Keep your bio under 400 characters';
  }
  return null;
}
