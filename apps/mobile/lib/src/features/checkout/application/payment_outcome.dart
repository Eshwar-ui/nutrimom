import '../../../core/network/api_exception.dart';

/// What a failed payment attempt means to the buyer. Mirrors
/// `apps/web/src/lib/payment-outcome.ts`, so checkout and the order screen say
/// the same thing the website does.
///
/// The distinction that matters most is whether money left the buyer's
/// account. Everything the gateway rejects (a declined card, a dismissed
/// sheet) is safe: nothing was charged. But if the gateway captured the
/// payment and our own verify call then failed, the buyer HAS paid and must
/// never be told "payment failed"; the webhook settles it shortly after. That
/// is [PaymentOutcomeKind.capturedUnconfirmed], and on a phone, where a signal
/// drops or the app is backgrounded mid-payment, it is not a corner case.
enum PaymentOutcomeKind {
  declined,
  cancelled,
  capturedUnconfirmed,
  offline,
  rateLimited,
  sessionExpired,
  gatewayUnavailable,
  serverError,
  itemUnavailable,
  alreadySettled,
  amountTooSmall,
  unknown,
}

enum OutcomeTone { neutral, warning, error }

class PaymentOutcome {
  const PaymentOutcome({
    required this.kind,
    required this.charged,
    required this.tone,
    required this.title,
    required this.description,
    this.retryLabel,
    this.reference,
  });

  final PaymentOutcomeKind kind;

  /// Whether money has left the buyer's account. When true, no copy anywhere
  /// may say the payment failed.
  final bool charged;
  final OutcomeTone tone;
  final String title;
  final String description;
  final String? retryLabel;

  /// The gateway payment id, for the buyer to quote to support.
  final String? reference;
}

PaymentOutcome declinedOutcome(String? message) => PaymentOutcome(
  kind: PaymentOutcomeKind.declined,
  charged: false,
  tone: OutcomeTone.error,
  title: "Payment didn't go through",
  description:
      '${(message ?? '').trim().isEmpty ? 'The payment was declined.' : message!.trim()} '
      'Nothing was charged. You can try again with the same or a different method.',
  retryLabel: 'Try again',
);

const PaymentOutcome cancelledOutcome = PaymentOutcome(
  kind: PaymentOutcomeKind.cancelled,
  charged: false,
  tone: OutcomeTone.neutral,
  title: 'Payment cancelled',
  description:
      'You closed the payment before it finished, so nothing was charged. Your order is '
      'held for about half an hour if you want to pay for it now.',
  retryLabel: 'Pay now',
);

PaymentOutcome capturedUnconfirmedOutcome([String? paymentId]) =>
    PaymentOutcome(
      kind: PaymentOutcomeKind.capturedUnconfirmed,
      charged: true,
      tone: OutcomeTone.warning,
      title: 'Payment received, confirming your order',
      description:
          "Your payment went through, but we couldn't confirm it on our side just yet. Nothing "
          'is lost: this usually settles within a minute or two, and you do not need to pay again.',
      retryLabel: 'Check again',
      reference: paymentId,
    );

/// Classifies a failure that happened before or after the gateway.
///
/// Pass [charged] when the failure came after the gateway's success callback:
/// from that point the money has moved, whatever the error says.
PaymentOutcome classifyPaymentError(
  Object error, {
  bool charged = false,
  String? paymentId,
}) {
  if (charged) return capturedUnconfirmedOutcome(paymentId);

  if (error is ApiException) {
    final status = error.statusCode;
    if (status == null) {
      return const PaymentOutcome(
        kind: PaymentOutcomeKind.offline,
        charged: false,
        tone: OutcomeTone.error,
        title: 'You appear to be offline',
        description:
            "We couldn't reach our servers, so the payment wasn't started. Check your "
            'connection and try again. Nothing was charged.',
        retryLabel: 'Try again',
      );
    }
    if (status == 429) {
      return const PaymentOutcome(
        kind: PaymentOutcomeKind.rateLimited,
        charged: false,
        tone: OutcomeTone.warning,
        title: 'Too many attempts',
        description:
            "You've made a lot of requests in a short time, so we've paused them briefly. "
            'Wait about a minute and try again. Nothing was charged.',
        retryLabel: 'Try again',
      );
    }
    if (status == 401 || status == 403) {
      return const PaymentOutcome(
        kind: PaymentOutcomeKind.sessionExpired,
        charged: false,
        tone: OutcomeTone.warning,
        title: 'Please sign in again',
        description:
            'Your session expired before the payment could start. Sign in again and your '
            'order will still be waiting. Nothing was charged.',
      );
    }
    // The API reports an unreachable or misconfigured gateway as 502/503: not
    // a problem with the order, so the buyer's bag is not blamed for it.
    if (status == 502 || status == 503) {
      return const PaymentOutcome(
        kind: PaymentOutcomeKind.gatewayUnavailable,
        charged: false,
        tone: OutcomeTone.warning,
        title: 'Payments are temporarily unavailable',
        description:
            "We couldn't reach our payment provider, so nothing was charged. Your order is "
            'saved. Please try paying again in a few minutes.',
        retryLabel: 'Try again',
      );
    }
    if (status >= 500) {
      return const PaymentOutcome(
        kind: PaymentOutcomeKind.serverError,
        charged: false,
        tone: OutcomeTone.error,
        title: 'Something went wrong on our side',
        description:
            'We hit an unexpected error before taking any payment. Please try again in a '
            'moment. You have not been charged.',
        retryLabel: 'Try again',
      );
    }
    if (status == 400 || status == 404) {
      final message = error.message;
      if (RegExp(
        r'no longer available|not available|unavailable',
        caseSensitive: false,
      ).hasMatch(message)) {
        return PaymentOutcome(
          kind: PaymentOutcomeKind.itemUnavailable,
          charged: false,
          tone: OutcomeTone.warning,
          title: 'That item is no longer available',
          description:
              '$message. Someone else got to it first, so we took no payment. The rest of '
              'your bag is still there.',
        );
      }
      if (RegExp(
        r'not awaiting payment|already',
        caseSensitive: false,
      ).hasMatch(message)) {
        return const PaymentOutcome(
          kind: PaymentOutcomeKind.alreadySettled,
          charged: false,
          tone: OutcomeTone.neutral,
          title: 'This order is already handled',
          description:
              "It's either been paid for or cancelled, so there's nothing left to pay. The "
              'order shows its current status.',
        );
      }
      if (RegExp(
        r'at least 100|amount must be',
        caseSensitive: false,
      ).hasMatch(message)) {
        return const PaymentOutcome(
          kind: PaymentOutcomeKind.amountTooSmall,
          charged: false,
          tone: OutcomeTone.error,
          title: "This amount can't be charged",
          description:
              'Online payments have to be at least ₹1. Please contact us so we can sort this '
              'order out for you.',
        );
      }
      return PaymentOutcome(
        kind: PaymentOutcomeKind.unknown,
        charged: false,
        tone: OutcomeTone.error,
        title: "We couldn't start the payment",
        description: '$message You have not been charged.',
        retryLabel: 'Try again',
      );
    }
  }
  return const PaymentOutcome(
    kind: PaymentOutcomeKind.unknown,
    charged: false,
    tone: OutcomeTone.error,
    title: "We couldn't complete the payment",
    description: 'Something unexpected happened before any payment was taken. Please try again.',
    retryLabel: 'Try again',
  );
}
