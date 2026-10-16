import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../contracts/models/order.dart';

/// The three ways a native checkout sheet can end.
sealed class GatewayResult {
  const GatewayResult();
}

/// The gateway captured the payment. From here, money has moved.
class GatewayPaid extends GatewayResult {
  const GatewayPaid({
    required this.paymentId,
    required this.razorpayOrderId,
    required this.signature,
  });

  final String paymentId;
  final String razorpayOrderId;
  final String signature;
}

/// The buyer closed the sheet. Nothing was charged.
class GatewayCancelled extends GatewayResult {
  const GatewayCancelled();
}

/// The gateway refused the payment (a declined card, a network error inside
/// the sheet). Nothing was charged.
class GatewayFailed extends GatewayResult {
  const GatewayFailed(this.code, this.message);

  final int? code;
  final String? message;
}

/// Turns Razorpay's callback API into a single awaitable result.
///
/// Unlike the web modal, which stays open after a decline for another go, the
/// native sheet closes on any error. So every attempt resolves here, and the
/// retry lives on the order screen rather than inside the sheet.
Future<GatewayResult> openRazorpay({
  required GatewayOrder gateway,
  required String description,
  required String buyerName,
  required String email,
  required String phone,
}) {
  final completer = Completer<GatewayResult>();
  final razorpay = Razorpay();

  void finish(GatewayResult result) {
    if (!completer.isCompleted) completer.complete(result);
    razorpay.clear();
  }

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse r) {
    final paymentId = r.paymentId;
    final orderId = r.orderId;
    final signature = r.signature;
    if (paymentId == null || orderId == null || signature == null) {
      // A success without the fields verify needs. Treated as captured: the
      // webhook can still settle it, and saying "failed" would be the one
      // unforgivable message.
      finish(
        GatewayPaid(
          paymentId: paymentId ?? '',
          razorpayOrderId: orderId ?? gateway.razorpayOrderId,
          signature: signature ?? '',
        ),
      );
      return;
    }
    finish(
      GatewayPaid(
        paymentId: paymentId,
        razorpayOrderId: orderId,
        signature: signature,
      ),
    );
  });
  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) {
    finish(
      r.code == Razorpay.PAYMENT_CANCELLED
          ? const GatewayCancelled()
          : GatewayFailed(r.code, r.message),
    );
  });
  // External wallets hand off to another app; the payment, if any, settles
  // through the webhook. The order screen will show where it landed.
  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse _) {
    finish(const GatewayCancelled());
  });

  razorpay.open({
    'key': gateway.keyId,
    'amount': gateway.amountInPaise,
    'currency': gateway.currency,
    'order_id': gateway.razorpayOrderId,
    // `name` is the merchant shown at the top of the sheet; the buyer's own
    // name belongs in prefill. Mixing them up put a customer's name where
    // the business name should be.
    'name': 'The Nurture Moms',
    'description': description,
    'prefill': {'name': buyerName, 'email': email, 'contact': phone},
    'theme': {'color': '#456F50'},
  });

  return completer.future;
}
