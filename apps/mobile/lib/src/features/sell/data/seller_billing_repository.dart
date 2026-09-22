import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/enums.dart';
import '../../../core/network/api_client.dart';
import '../../auth/application/auth_controller.dart';

/// Mirror of `SellerBillingStatus` in `packages/shared`.
///
/// The three gates are separate fields on purpose: `assertCanList` requires
/// registration **and** admin approval **and** an active membership, and a
/// seller stuck on any one of them needs to be told which.
class SellerBillingStatus {
  const SellerBillingStatus({
    required this.registrationPaid,
    required this.registrationFeePaise,
    required this.sellerVerified,
    this.activePlan,
    this.membershipExpiresAt,
    this.lastMembershipExpiredAt,
    required this.canList,
  });

  final bool registrationPaid;
  final int registrationFeePaise;

  /// Paid **and** admin-approved. Can be true while [canList] is false, when
  /// the membership has lapsed.
  final bool sellerVerified;

  final MembershipPlan? activePlan;
  final DateTime? membershipExpiresAt;

  /// Set when a lapsed plan is the reason [canList] is false, so the UI can
  /// say "expired on X, renew" instead of showing a first-time purchase.
  final DateTime? lastMembershipExpiredAt;

  final bool canList;

  SellerGate get gate {
    if (!registrationPaid) return SellerGate.notRegistered;
    if (!sellerVerified) return SellerGate.awaitingApproval;
    if (!canList) return SellerGate.needsMembership;
    return SellerGate.canList;
  }

  factory SellerBillingStatus.fromJson(Map<String, dynamic> json) =>
      SellerBillingStatus(
        registrationPaid: json['registrationPaid'] as bool? ?? false,
        registrationFeePaise:
            (json['registrationFeePaise'] as num?)?.toInt() ?? 0,
        sellerVerified: json['sellerVerified'] as bool? ?? false,
        activePlan: MembershipPlan.tryParse(json['activePlan'] as String?),
        membershipExpiresAt: _date(json['membershipExpiresAt']),
        lastMembershipExpiredAt: _date(json['lastMembershipExpiredAt']),
        canList: json['canList'] as bool? ?? false,
      );

  static DateTime? _date(Object? v) =>
      v is String ? DateTime.tryParse(v)?.toLocal() : null;
}

enum SellerGate { notRegistered, awaitingApproval, needsMembership, canList }

class SellerBillingRepository {
  SellerBillingRepository(this._api);

  final ApiClient _api;

  Future<SellerBillingStatus> status() async {
    final json = await _api.get<Map<String, dynamic>>('/seller/billing/status');
    return SellerBillingStatus.fromJson(json);
  }
}

final sellerBillingRepositoryProvider = Provider<SellerBillingRepository>((
  ref,
) {
  return SellerBillingRepository(ref.watch(apiClientProvider));
});

final sellerBillingStatusProvider = FutureProvider<SellerBillingStatus?>((
  ref,
) async {
  final signedIn = ref.watch(
    authControllerProvider.select((s) => s.isSignedIn),
  );
  if (!signedIn) return null;
  return ref.watch(sellerBillingRepositoryProvider).status();
});
