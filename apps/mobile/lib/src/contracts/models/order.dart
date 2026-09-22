import '../enums.dart';
import '../listing_image.dart';

/// Mirror of `ShippingAddress` in `packages/shared`.
class ShippingAddress {
  const ShippingAddress({
    required this.fullName,
    required this.phone,
    required this.line1,
    this.line2 = '',
    required this.city,
    required this.state,
    required this.postalCode,
    this.country = 'India',
  });

  final String fullName;
  final String phone;
  final String line1;
  final String line2;
  final String city;
  final String state;
  final String postalCode;
  final String country;

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'phone': phone,
    'line1': line1,
    'line2': line2,
    'city': city,
    'state': state,
    'postalCode': postalCode,
    'country': country,
  };

  factory ShippingAddress.fromJson(Map<String, dynamic> json) =>
      ShippingAddress(
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        line1: json['line1'] as String? ?? '',
        line2: json['line2'] as String? ?? '',
        city: json['city'] as String? ?? '',
        state: json['state'] as String? ?? '',
        postalCode: json['postalCode'] as String? ?? '',
        country: json['country'] as String? ?? 'India',
      );

  /// One line per row, blanks dropped, for the order screen.
  List<String> get lines => [
    fullName,
    line1,
    if (line2.trim().isNotEmpty) line2,
    '$city, $state $postalCode',
    phone,
  ];
}

/// Mirror of `OrderItem`. Title, price and image are snapshots taken at
/// purchase, so an order still reads correctly after the listing changes.
class OrderItem {
  const OrderItem({
    required this.id,
    required this.listingId,
    required this.listingTitle,
    this.image,
    required this.unitPriceInPaise,
    required this.sellerId,
  });

  final String id;
  final String listingId;
  final String listingTitle;
  final String? image;
  final int unitPriceInPaise;
  final String sellerId;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final raw = json['image'] as String?;
    return OrderItem(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      listingTitle: json['listingTitle'] as String? ?? '',
      image: raw == null ? null : resolveListingImage(raw),
      unitPriceInPaise: (json['unitPriceInPaise'] as num).toInt(),
      sellerId: json['sellerId'] as String? ?? '',
    );
  }
}

/// Mirror of `Order` (the buyer's view; the admin detail is separate).
class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentMethod,
    required this.totalInPaise,
    required this.shippingAddress,
    required this.items,
    this.razorpayOrderId,
    this.refundedAt,
    required this.createdAt,
  });

  final String id;

  /// `NM-YYYYMMDD-NNN`: what a buyer quotes to support.
  final String orderNumber;
  final OrderStatus status;
  final PaymentMethod paymentMethod;
  final int totalInPaise;
  final ShippingAddress shippingAddress;
  final List<OrderItem> items;
  final String? razorpayOrderId;
  final DateTime? refundedAt;
  final DateTime createdAt;

  /// Only an unpaid online order can still be paid for.
  bool get awaitingPayment =>
      status == OrderStatus.pending && paymentMethod == PaymentMethod.online;

  factory Order.fromJson(Map<String, dynamic> json) => Order(
    id: json['id'] as String,
    orderNumber: json['orderNumber'] as String? ?? '',
    status: OrderStatus.parse(json['status'] as String),
    paymentMethod: PaymentMethod.parse(
      json['paymentMethod'] as String? ?? 'ONLINE',
    ),
    totalInPaise: (json['totalInPaise'] as num).toInt(),
    shippingAddress: ShippingAddress.fromJson(
      (json['shippingAddress'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    items: (json['items'] as List<dynamic>? ?? const [])
        .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
        .toList(growable: false),
    razorpayOrderId: json['razorpayOrderId'] as String?,
    refundedAt: json['refundedAt'] is String
        ? DateTime.tryParse(json['refundedAt'] as String)?.toLocal()
        : null,
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
        DateTime.now(),
  );
}

/// Mirror of `RazorpayOrderResponse`. The amount is the server's: the client
/// never sends one, and never trusts its own bag total over this.
class GatewayOrder {
  const GatewayOrder({
    required this.orderId,
    required this.razorpayOrderId,
    required this.amountInPaise,
    required this.currency,
    required this.keyId,
  });

  final String orderId;
  final String razorpayOrderId;
  final int amountInPaise;
  final String currency;
  final String keyId;

  factory GatewayOrder.fromJson(Map<String, dynamic> json) => GatewayOrder(
    orderId: json['orderId'] as String,
    razorpayOrderId: json['razorpayOrderId'] as String,
    amountInPaise: (json['amountInPaise'] as num).toInt(),
    currency: json['currency'] as String? ?? 'INR',
    keyId: json['keyId'] as String,
  );
}
