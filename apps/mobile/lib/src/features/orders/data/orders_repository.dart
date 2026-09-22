import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/order.dart';
import '../../../core/network/api_client.dart';

class OrdersRepository {
  OrdersRepository(this._api);

  final ApiClient _api;

  /// Creates the PENDING order. The server re-prices every item, re-checks it
  /// is still APPROVED, refuses your own listings, and holds them for 30
  /// minutes. Only listing ids are sent; nothing the client says about price
  /// is trusted.
  Future<Order> create({
    required List<String> listingIds,
    required ShippingAddress address,
  }) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/orders',
      body: {'listingIds': listingIds, 'shippingAddress': address.toJson()},
    );
    return Order.fromJson(json);
  }

  Future<List<Order>> mine() async {
    final json = await _api.get<List<dynamic>>('/orders');
    return json
        .map((e) => Order.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<Order> byId(String id) async {
    final json = await _api.get<Map<String, dynamic>>('/orders/$id');
    return Order.fromJson(json);
  }

  /// Idempotent on the server: an order that already has a gateway order gets
  /// the same one back, so retrying never opens a second charge.
  Future<GatewayOrder> gatewayOrder(String orderId) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/payments/order',
      body: {'orderId': orderId},
    );
    return GatewayOrder.fromJson(json);
  }

  /// Settles the order after the gateway's success callback. The signature is
  /// checked server-side; this call is what marks the order PAID.
  Future<Order> verify({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/payments/verify',
      body: {
        'orderId': orderId,
        'razorpayOrderId': razorpayOrderId,
        'razorpayPaymentId': razorpayPaymentId,
        'razorpaySignature': razorpaySignature,
      },
    );
    return Order.fromJson(json);
  }
}

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.watch(apiClientProvider));
});

final myOrdersProvider = FutureProvider<List<Order>>((ref) {
  return ref.watch(ordersRepositoryProvider).mine();
});

final orderProvider = FutureProvider.family<Order, String>((ref, id) {
  return ref.watch(ordersRepositoryProvider).byId(id);
});
