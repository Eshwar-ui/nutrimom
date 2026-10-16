import '../../../contracts/models/order.dart';
import '../../orders/data/orders_repository.dart';
import 'payment_outcome.dart';
import 'razorpay_gateway.dart';

/// The result of one payment attempt against one order.
sealed class PayResult {
  const PayResult();
}

class PaidResult extends PayResult {
  const PaidResult(this.order);

  final Order order;
}

class OutcomeResult extends PayResult {
  const OutcomeResult(this.outcome);

  final PaymentOutcome outcome;
}

/// One attempt to pay for an order that already exists.
///
/// Always scoped to an existing order, never to a bag. That is deliberate: the
/// web's checkout creates the order and then the gateway order in one go, so a
/// gateway failure followed by a retry creates a *second* order, which then
/// fails with "no longer available" because the first one is holding the
/// buyer's own items. Here the order is created once, and every retry,
/// whatever failed, runs through this against that same order. The server
/// reuses its gateway order, so a retry never opens a second charge either.
Future<PayResult> payForOrder({
  required OrdersRepository repo,
  required Order order,
  required String buyerName,
  required String email,
}) async {
  final GatewayOrder gateway;
  try {
    gateway = await repo.gatewayOrder(order.id);
  } catch (e) {
    // The gateway never opened: nothing can have been charged.
    return OutcomeResult(classifyPaymentError(e));
  }

  final result = await openRazorpay(
    gateway: gateway,
    description: 'Order ${order.orderNumber}',
    buyerName: buyerName,
    email: email,
    phone: order.shippingAddress.phone,
  );

  switch (result) {
    case GatewayCancelled():
      return const OutcomeResult(cancelledOutcome);
    case GatewayFailed(:final message):
      return OutcomeResult(declinedOutcome(message));
    case GatewayPaid(
      :final paymentId,
      :final razorpayOrderId,
      :final signature,
    ):
      // From here the gateway HAS captured the money. Any failure below is a
      // confirmation problem, never a payment failure.
      try {
        final settled = await repo.verify(
          orderId: order.id,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        );
        return PaidResult(settled);
      } catch (e) {
        return OutcomeResult(
          classifyPaymentError(e, charged: true, paymentId: paymentId),
        );
      }
  }
}
