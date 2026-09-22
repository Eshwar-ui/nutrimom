/// Dart mirror of the enums in `packages/shared/src/index.ts`.
///
/// The web app imports those types; this app cannot, so they are restated here
/// and the two are held together by `scripts/check-mobile-contract.mjs`, which
/// fails CI when a value exists on one side and not the other. Adding a value
/// to the API without adding it here is the failure mode this file exists to
/// prevent — do not "fix" a drift failure by loosening the parser.
library;

/// Thrown when the API sends an enum value this build has never heard of.
///
/// This is a real, expected condition in a released app: the server can deploy
/// a new value while an old build is still installed. The force-upgrade gate
/// (PRD R0.5) is what bounds how long that can last; this exception is what
/// makes it visible in Crashlytics instead of silently mis-rendering.
class ContractDriftException implements Exception {
  const ContractDriftException(this.enumName, this.value);

  final String enumName;
  final String value;

  @override
  String toString() =>
      'ContractDriftException: $enumName has no value "$value". '
      'The API is ahead of this build.';
}

T _parse<T>(
  String enumName,
  String value,
  List<T> values,
  String Function(T) wireOf,
) {
  for (final v in values) {
    if (wireOf(v) == value) return v;
  }
  throw ContractDriftException(enumName, value);
}

T? _tryParse<T>(String? value, List<T> values, String Function(T) wireOf) {
  if (value == null) return null;
  for (final v in values) {
    if (wireOf(v) == value) return v;
  }
  return null;
}

enum Role {
  customer('CUSTOMER'),
  admin('ADMIN');

  const Role(this.wire);
  final String wire;

  static Role parse(String v) => _parse('Role', v, values, (e) => e.wire);
  static Role? tryParse(String? v) => _tryParse(v, values, (e) => e.wire);
}

enum Condition {
  isNew('NEW', 'New with tags'),
  likeNew('LIKE_NEW', 'Like new'),
  good('GOOD', 'Good'),
  fair('FAIR', 'Fair');

  const Condition(this.wire, this.label);
  final String wire;
  final String label;

  static Condition parse(String v) =>
      _parse('Condition', v, values, (e) => e.wire);
  static Condition? tryParse(String? v) => _tryParse(v, values, (e) => e.wire);
}

enum DeliveryOption {
  pickup('PICKUP', 'Pickup only'),
  delivery('DELIVERY', 'Delivery available'),
  both('BOTH', 'Pickup or delivery');

  const DeliveryOption(this.wire, this.label);
  final String wire;
  final String label;

  static DeliveryOption parse(String v) =>
      _parse('DeliveryOption', v, values, (e) => e.wire);
  static DeliveryOption? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum ListingStatus {
  pending('PENDING'),
  approved('APPROVED'),
  rejected('REJECTED'),
  reserved('RESERVED'),
  sold('SOLD');

  const ListingStatus(this.wire);
  final String wire;

  static ListingStatus parse(String v) =>
      _parse('ListingStatus', v, values, (e) => e.wire);
  static ListingStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum OrderStatus {
  pending('PENDING'),
  paid('PAID'),
  shipped('SHIPPED'),
  delivered('DELIVERED'),
  cancelled('CANCELLED');

  const OrderStatus(this.wire);
  final String wire;

  static OrderStatus parse(String v) =>
      _parse('OrderStatus', v, values, (e) => e.wire);
  static OrderStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum PaymentMethod {
  /// Retired. Kept so historical rows stay parseable; nothing selects it —
  /// `OrdersService.create` hard-codes ONLINE.
  cod('COD', 'Cash on Delivery'),
  online('ONLINE', 'Online payment');

  const PaymentMethod(this.wire, this.label);
  final String wire;
  final String label;

  static PaymentMethod parse(String v) =>
      _parse('PaymentMethod', v, values, (e) => e.wire);
  static PaymentMethod? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum MembershipPlan {
  monthly('MONTHLY', 'Monthly', 9900, 30),
  quarterly('QUARTERLY', 'Quarterly', 19900, 90),
  halfYearly('HALF_YEARLY', 'Half-Yearly', 49900, 180),
  yearly('YEARLY', 'Yearly', 99900, 365, bestValue: true);

  const MembershipPlan(
    this.wire,
    this.label,
    this.priceInPaise,
    this.durationDays, {
    this.bestValue = false,
  });

  final String wire;
  final String label;

  /// Display only. The server is authoritative for what is charged — the
  /// client never sends an amount, only a plan key.
  final int priceInPaise;
  final int durationDays;
  final bool bestValue;

  static MembershipPlan parse(String v) =>
      _parse('MembershipPlan', v, values, (e) => e.wire);
  static MembershipPlan? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum SellerPaymentType {
  registration('REGISTRATION'),
  membership('MEMBERSHIP');

  const SellerPaymentType(this.wire);
  final String wire;

  static SellerPaymentType parse(String v) =>
      _parse('SellerPaymentType', v, values, (e) => e.wire);
  static SellerPaymentType? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum SellerPaymentStatus {
  pending('PENDING'),
  paid('PAID'),
  failed('FAILED');

  const SellerPaymentStatus(this.wire);
  final String wire;

  static SellerPaymentStatus parse(String v) =>
      _parse('SellerPaymentStatus', v, values, (e) => e.wire);
  static SellerPaymentStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum ShipmentStatus {
  pending('PENDING', 'Awaiting label'),
  labelGenerated('LABEL_GENERATED', 'Label ready'),
  shipped('SHIPPED', 'Shipped'),
  delivered('DELIVERED', 'Delivered');

  const ShipmentStatus(this.wire, this.label);
  final String wire;
  final String label;

  static ShipmentStatus parse(String v) =>
      _parse('ShipmentStatus', v, values, (e) => e.wire);
  static ShipmentStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum PayoutStatus {
  pending('PENDING', 'On hold'),
  payable('PAYABLE', 'Ready to pay'),
  paid('PAID', 'Paid out'),
  cancelled('CANCELLED', 'Cancelled');

  const PayoutStatus(this.wire, this.label);
  final String wire;
  final String label;

  static PayoutStatus parse(String v) =>
      _parse('PayoutStatus', v, values, (e) => e.wire);
  static PayoutStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum NotificationType {
  listingApproved('LISTING_APPROVED'),
  listingRejected('LISTING_REJECTED'),
  itemSold('ITEM_SOLD'),
  orderPlaced('ORDER_PLACED'),
  orderCancelled('ORDER_CANCELLED'),
  paymentRefunded('PAYMENT_REFUNDED'),
  sellerRegistered('SELLER_REGISTERED'),
  membershipExpiring('MEMBERSHIP_EXPIRING'),
  membershipExpired('MEMBERSHIP_EXPIRED');

  const NotificationType(this.wire);
  final String wire;

  static NotificationType parse(String v) =>
      _parse('NotificationType', v, values, (e) => e.wire);

  /// Notifications are the enum most likely to gain values, and a notification
  /// the app cannot classify is still readable — it carries its own `message`.
  /// So this one is parsed leniently and the row renders without an icon.
  static NotificationType? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

enum ContactMessageStatus {
  isNew('NEW'),
  read('READ'),
  responded('RESPONDED');

  const ContactMessageStatus(this.wire);
  final String wire;

  static ContactMessageStatus parse(String v) =>
      _parse('ContactMessageStatus', v, values, (e) => e.wire);
  static ContactMessageStatus? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);
}

/// The Nurture Journal's taxonomy (founders' brief §11), mirroring
/// `BLOG_CATEGORIES` in shared.
///
/// Three fields, not two: the slug is part of the URL contract
/// (`/journal?category=starting-solids`) and must never be derived from the
/// label, or renaming "Starting Solids" for readability would silently break
/// every link to it. `scripts/check-mobile-contract.mjs` compares all three.
enum BlogCategory {
  pregnancy('PREGNANCY', 'pregnancy', 'Pregnancy'),
  yoga('YOGA', 'yoga', 'Yoga'),
  postpartum('POSTPARTUM', 'postpartum', 'Postpartum'),
  nutrition('NUTRITION', 'nutrition', 'Nutrition'),
  startingSolids('STARTING_SOLIDS', 'starting-solids', 'Starting Solids'),
  baby('BABY', 'baby', 'Baby'),
  toddler('TODDLER', 'toddler', 'Toddler'),
  motherhood('MOTHERHOOD', 'motherhood', 'Motherhood'),
  mompreneur('MOMPRENEUR', 'mompreneur', 'Mompreneur'),
  preloved('PRELOVED', 'preloved', 'Preloved');

  const BlogCategory(this.wire, this.slug, this.label);
  final String wire;
  final String slug;
  final String label;

  static BlogCategory parse(String v) =>
      _parse('BlogCategory', v, values, (e) => e.wire);

  /// Lenient on purpose: the column is nullable (posts written before the
  /// taxonomy have none), and an uncategorised post is still readable.
  static BlogCategory? tryParse(String? v) =>
      _tryParse(v, values, (e) => e.wire);

  static BlogCategory? fromSlug(String? slug) =>
      _tryParse(slug, values, (e) => e.slug);
}

/// Mirrors `orderStatusLabel()` in shared, including the COD special case —
/// no live order can be COD, but a historical row must still render correctly.
String orderStatusLabel(OrderStatus status, [PaymentMethod? paymentMethod]) {
  if (status == OrderStatus.pending && paymentMethod == PaymentMethod.cod) {
    return 'Order placed';
  }
  return switch (status) {
    OrderStatus.pending => 'Awaiting payment',
    OrderStatus.paid => 'Paid',
    OrderStatus.shipped => 'Shipped',
    OrderStatus.delivered => 'Delivered',
    OrderStatus.cancelled => 'Cancelled',
  };
}

/// Mirrors `isOrderConfirmed()` in shared.
bool isOrderConfirmed(OrderStatus status, [PaymentMethod? paymentMethod]) {
  if (status == OrderStatus.cancelled) return false;
  if (paymentMethod == PaymentMethod.cod) return true;
  return status != OrderStatus.pending;
}
