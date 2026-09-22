import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/money.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

/// Mirror of `apps/web/src/lib/booking.ts`.
///
/// Each service CTA prefills a WhatsApp message with its funnel keyword from
/// the founders' brief (§12): YOGA, FOOD, SOLIDS, CONNECTION. An enquiry then
/// arrives already attributed to the content that produced it, which is the
/// only attribution the business has until analytics exist.
enum BookingIntent {
  yoga('YOGA', 'Yoga', "Hi! I'd like to know more about your yoga sessions."),
  nutrition(
    'FOOD',
    'Nutrition',
    "Hi! I'd like to book a nutrition consultation.",
  ),
  solids(
    'SOLIDS',
    'Starting Solids',
    "Hi! I'd like to book a Starting Solids session.",
  ),
  community(
    'CONNECTION',
    'Community',
    "Hi! I'd like to join the mom support community.",
  );

  const BookingIntent(this.keyword, this.service, this.message);

  final String keyword;

  /// Human name, used as the enquiry subject so admin can tell a yoga
  /// enquiry from a general one before backend item B3 adds a real column.
  final String service;
  final String message;

  String get whatsappText => '$keyword — $message';
}

/// The public `BusinessProfile` (`GET /business-profile`).
class BusinessProfile {
  const BusinessProfile({
    required this.supportPhone,
    required this.supportEmail,
  });

  final String supportPhone;
  final String supportEmail;

  factory BusinessProfile.fromJson(Map<String, dynamic> json) =>
      BusinessProfile(
        supportPhone: (json['supportPhone'] as String? ?? '').trim(),
        supportEmail: (json['supportEmail'] as String? ?? '').trim(),
      );
}

final businessProfileProvider = FutureProvider<BusinessProfile?>((ref) async {
  try {
    final json = await ref
        .watch(apiClientProvider)
        .get<Map<String, dynamic>>('/business-profile', authed: false);
    return BusinessProfile.fromJson(json);
  } on ApiException {
    // Treated like a blank number: the caller falls back to the enquiry form,
    // which works without it.
    return null;
  }
});

/// The WhatsApp destination for an intent, or null.
///
/// Null is a real state, not an error: `supportPhone` is admin-entered at
/// /admin/settings and starts empty. A "Book a session" button that opens
/// `wa.me/` with no number looks broken at the exact moment someone decided
/// to buy, so every caller falls back to the enquiry form instead.
String? bookingWhatsappUrl(BusinessProfile? profile, BookingIntent intent) {
  final phone = profile?.supportPhone ?? '';
  if (phone.isEmpty) return null;
  return whatsappLink(phone, intent.whatsappText);
}

/// `POST /contact`. Public and rate-limited on the server.
class EnquiryRepository {
  EnquiryRepository(this._api);

  final ApiClient _api;

  Future<void> send({
    required String name,
    required String email,
    String? phone,
    required String subject,
    required String message,
  }) async {
    await _api.post<Map<String, dynamic>>(
      '/contact',
      body: {
        'name': name,
        'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'subject': subject,
        'message': message,
      },
      authed: false,
    );
  }
}

final enquiryRepositoryProvider = Provider<EnquiryRepository>((ref) {
  return EnquiryRepository(ref.watch(apiClientProvider));
});
