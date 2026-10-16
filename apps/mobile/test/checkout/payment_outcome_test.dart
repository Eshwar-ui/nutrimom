import 'package:flutter_test/flutter_test.dart';
import 'package:nurture_moms/src/core/network/api_exception.dart';
import 'package:nurture_moms/src/features/bag/application/bag_controller.dart';
import 'package:nurture_moms/src/features/checkout/application/payment_outcome.dart';

/// Mirrors the cases in `apps/web/src/lib/payment-outcome.ts`.
void main() {
  ApiException api(int? status, [String message = '']) =>
      ApiException(message: message, statusCode: status);

  group('the rule that matters: charged is never "failed"', () {
    test('any error after capture is captured-unconfirmed, whatever it says', () {
      for (final e in [api(500), api(400, 'Invalid payment signature'), api(null), Exception('x')]) {
        final o = classifyPaymentError(e, charged: true, paymentId: 'pay_123');
        expect(o.kind, PaymentOutcomeKind.capturedUnconfirmed);
        expect(o.charged, isTrue);
        expect(o.reference, 'pay_123');
        expect(o.title.toLowerCase(), isNot(contains('fail')));
        expect(o.description.toLowerCase(), contains('do not need to pay again'));
      }
    });

    test('captured is shown as a warning, never in the error colour', () {
      expect(capturedUnconfirmedOutcome('pay_1').tone, OutcomeTone.warning);
    });

    test('its retry checks the order rather than paying again', () {
      expect(capturedUnconfirmedOutcome().retryLabel, 'Check again');
    });
  });

  group('failures before the gateway are uncharged', () {
    test('no response at all reads as offline', () {
      final o = classifyPaymentError(api(null));
      expect(o.kind, PaymentOutcomeKind.offline);
      expect(o.charged, isFalse);
    });

    test('429 is rate limiting', () {
      expect(classifyPaymentError(api(429)).kind, PaymentOutcomeKind.rateLimited);
    });

    test('401 and 403 are an expired session', () {
      expect(classifyPaymentError(api(401)).kind, PaymentOutcomeKind.sessionExpired);
      expect(classifyPaymentError(api(403)).kind, PaymentOutcomeKind.sessionExpired);
    });

    test('502 and 503 blame the gateway, not the bag', () {
      expect(classifyPaymentError(api(502)).kind, PaymentOutcomeKind.gatewayUnavailable);
      expect(classifyPaymentError(api(503)).kind, PaymentOutcomeKind.gatewayUnavailable);
    });

    test('other 5xx is our error', () {
      expect(classifyPaymentError(api(500)).kind, PaymentOutcomeKind.serverError);
    });

    test('the API wording for a taken item maps to item-unavailable', () {
      // The two messages OrdersService.create actually throws.
      for (final m in ['"Cloth Books" is no longer available', 'One or more items are no longer available']) {
        expect(classifyPaymentError(api(400, m)).kind, PaymentOutcomeKind.itemUnavailable);
      }
    });

    test('an already-settled order is neutral, not an error', () {
      final o = classifyPaymentError(api(400, 'Order is not awaiting payment'));
      expect(o.kind, PaymentOutcomeKind.alreadySettled);
      expect(o.tone, OutcomeTone.neutral);
    });

    test('the ₹1 gateway floor is recognised', () {
      expect(
        classifyPaymentError(api(400, 'amount must be at least 100 paise')).kind,
        PaymentOutcomeKind.amountTooSmall,
      );
    });

    test('an unrecognised 400 keeps the server wording and says nothing was charged', () {
      final o = classifyPaymentError(api(400, 'Something specific.'));
      expect(o.kind, PaymentOutcomeKind.unknown);
      expect(o.description, contains('Something specific.'));
      expect(o.description, contains('not been charged'));
    });
  });

  group('gateway results', () {
    test('a decline carries the gateway reason and says nothing was charged', () {
      final o = declinedOutcome('Card declined by bank');
      expect(o.charged, isFalse);
      expect(o.description, contains('Card declined by bank'));
      expect(o.description, contains('Nothing was charged'));
    });

    test('a decline with no reason still reads as a sentence', () {
      expect(declinedOutcome(null).description, startsWith('The payment was declined.'));
    });

    test('cancelling is neutral and offers to pay', () {
      expect(cancelledOutcome.tone, OutcomeTone.neutral);
      expect(cancelledOutcome.charged, isFalse);
      expect(cancelledOutcome.retryLabel, 'Pay now');
    });
  });

  group('bag', () {
    test('the total is the sum of snapshot prices, in paise', () {
      const a = BagItem(listingId: 'a', title: 'A', priceInPaise: 80000, city: 'Pune', sellerId: 's', sellerName: 'S');
      const b = BagItem(listingId: 'b', title: 'B', priceInPaise: 130000, city: 'Delhi', sellerId: 's', sellerName: 'S');
      expect(bagTotalPaise([a, b]), 210000);
      expect(bagTotalPaise(const []), 0);
    });

    test('a bag item round-trips through its stored form', () {
      const a = BagItem(listingId: 'a', title: 'A', image: 'http://x/y.png', priceInPaise: 80000, city: 'Pune', sellerId: 's', sellerName: 'S');
      final back = BagItem.fromJson(a.toJson());
      expect(back.listingId, 'a');
      expect(back.priceInPaise, 80000);
      expect(back.image, 'http://x/y.png');
    });
  });
}
