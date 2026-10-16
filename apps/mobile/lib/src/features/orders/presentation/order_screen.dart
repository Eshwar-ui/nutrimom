import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/models/order.dart';
import '../../../contracts/money.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/application/browse_controller.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/presentation/widgets/listing_image.dart';
import '../../checkout/application/pay_for_order.dart';
import '../../checkout/application/payment_outcome.dart';
import '../../checkout/presentation/outcome_card.dart';
import '../data/orders_repository.dart';

/// One order, and the only place payment happens.
///
/// Arriving from checkout (`autoPay`), it opens the payment sheet straight
/// away. Every retry afterwards (declined, cancelled, gateway down, captured
/// but unconfirmed) is handled here, against this order, so a retry can never
/// create a second order or a second charge.
class OrderScreen extends ConsumerStatefulWidget {
  const OrderScreen({super.key, required this.id, this.autoPay = false});

  final String id;
  final bool autoPay;

  @override
  ConsumerState<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends ConsumerState<OrderScreen> {
  bool _paying = false;
  bool _autoPayStarted = false;
  bool _justPaid = false;
  PaymentOutcome? _outcome;

  Future<void> _pay(Order order) async {
    setState(() {
      _paying = true;
      _outcome = null;
    });
    final user = ref.read(authControllerProvider).user;
    final result = await payForOrder(
      repo: ref.read(ordersRepositoryProvider),
      order: order,
      buyerName: order.shippingAddress.fullName,
      email: user?.email ?? '',
    );
    if (!mounted) return;
    switch (result) {
      case PaidResult():
        _settled();
      case OutcomeResult(:final outcome):
        setState(() => _outcome = outcome);
    }
    if (mounted) setState(() => _paying = false);
  }

  void _settled() {
    setState(() {
      _justPaid = true;
      _outcome = null;
    });
    ref.invalidate(orderProvider(widget.id));
    ref.invalidate(myOrdersProvider);
    // These items are SOLD now: every cached view of them is stale.
    ref.invalidate(latestListingsProvider);
    ref.invalidate(browseProvider);
    ref.invalidate(listingDetailProvider);
  }

  /// "Check again" for a captured-but-unconfirmed payment: re-read the order
  /// and move on if the webhook has since settled it.
  Future<void> _recheck() async {
    setState(() => _paying = true);
    try {
      final latest = await ref.read(ordersRepositoryProvider).byId(widget.id);
      if (!mounted) return;
      if (latest.status == OrderStatus.paid) {
        _settled();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Still confirming. This can take a minute; your payment is safe.',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Couldn't reach us just now. Your payment is still safe.",
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = ref.watch(orderProvider(widget.id));

    // Arriving from checkout: open the sheet once, as soon as the order loads.
    final loaded = order.value;
    if (widget.autoPay &&
        !_autoPayStarted &&
        loaded != null &&
        loaded.awaitingPayment) {
      _autoPayStarted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _pay(loaded);
      });
    }

    final canPop = Navigator.of(context).canPop();
    return Scaffold(
      appBar: AppBar(
        title: Text(loaded?.orderNumber ?? 'Order'),
        // Reached from checkout the order replaces the trail, so there is no
        // back; close goes home rather than leaving the buyer stranded.
        leading: canPop
            ? null
            : IconButton(
                onPressed: () => context.go('/'),
                tooltip: 'Close',
                icon: const Icon(Icons.close),
              ),
      ),
      body: AsyncView(
        value: order,
        onRetry: () => ref.invalidate(orderProvider(widget.id)),
        data: (o) => _Body(
          order: o,
          paying: _paying,
          justPaid: _justPaid,
          outcome: _outcome,
          onPay: () => _pay(o),
          onRecheck: _recheck,
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.order,
    required this.paying,
    required this.justPaid,
    required this.outcome,
    required this.onPay,
    required this.onRecheck,
  });

  final Order order;
  final bool paying;
  final bool justPaid;
  final PaymentOutcome? outcome;
  final VoidCallback onPay;
  final VoidCallback onRecheck;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final out = outcome;
    // The card carries its own button only when its retry differs from the
    // Pay button below it: a captured payment is retried by *checking*, never
    // by paying again. For every other outcome the Pay button is the retry,
    // and a second "Try again" inside the card was the same action twice.
    final retry =
        out != null && out.kind == PaymentOutcomeKind.capturedUnconfirmed
        ? onRecheck
        : null;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
      children: [
        if (justPaid) ...[_Success(order: order), const SizedBox(height: 18)],
        _StatusTrack(order: order),
        const SizedBox(height: 18),
        if (out != null) ...[
          OutcomeCard(outcome: out, onRetry: retry, busy: paying),
          const SizedBox(height: 16),
        ],
        if (order.awaitingPayment && (out == null || !out.charged)) ...[
          FilledButton(
            onPressed: paying ? null : onPay,
            child: paying
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: t.primaryForeground,
                    ),
                  )
                : Text('Pay ${formatPaise(order.totalInPaise)}'),
          ),
          const SizedBox(height: 8),
          Text(
            'UPI, cards and netbanking. These items are held for you for about half an hour '
            'after the order was placed.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 22),
        ],
        Text('Items', style: theme.textTheme.titleLarge),
        const SizedBox(height: 10),
        for (final item in order.items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 60,
                    height: 60,
                    child: ListingImage(
                      url: item.image,
                      semanticLabel: item.listingTitle,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    item.listingTitle,
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
                Text(
                  formatPaise(item.unitPriceInPaise),
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        Divider(color: t.border),
        Row(
          children: [
            Expanded(child: Text('Total', style: theme.textTheme.titleMedium)),
            Text(
              formatPaise(order.totalInPaise),
              style: theme.textTheme.titleLarge?.copyWith(color: t.primary),
            ),
          ],
        ),
        if (order.refundedAt != null) ...[
          const SizedBox(height: 8),
          Text(
            'Refunded. Gateway settlement usually takes 5 to 7 working days.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: t.mutedForeground,
            ),
          ),
        ],
        const SizedBox(height: 22),
        Text('Delivering to', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        for (final line in order.shippingAddress.lines)
          Text(line, style: theme.textTheme.bodyMedium),
        const SizedBox(height: 26),
        OutlinedButton(
          onPressed: () => context.push('/enquiry'),
          child: const Text('Questions about this order?'),
        ),
      ],
    );
  }
}

class _Success extends StatelessWidget {
  const _Success({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Color.alphaBlend(t.sage.withValues(alpha: 0.4), t.surface),
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle, color: t.primary, size: 32),
          const SizedBox(height: 10),
          Text(
            'Thank you, your order is confirmed',
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: 6),
          Text(
            "We've let the seller know. You'll get a notification when it ships.",
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

/// Placed, paid, shipped, delivered: the buyer's view of where the order is.
class _StatusTrack extends StatelessWidget {
  const _StatusTrack({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final status = order.status;

    if (status == OrderStatus.cancelled) {
      return Row(
        children: [
          Icon(Icons.cancel_outlined, color: t.mutedForeground),
          const SizedBox(width: 8),
          Text('Cancelled', style: theme.textTheme.titleMedium),
        ],
      );
    }

    const steps = [
      (OrderStatus.pending, 'Placed'),
      (OrderStatus.paid, 'Paid'),
      (OrderStatus.shipped, 'Shipped'),
      (OrderStatus.delivered, 'Delivered'),
    ];
    final reached = steps.indexWhere((s) => s.$1 == status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          orderStatusLabel(status, order.paymentMethod),
          style: theme.textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (var i = 0; i < steps.length; i++) ...[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: i <= reached ? t.primary : t.border,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      steps[i].$2,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: i <= reached ? t.foreground : t.mutedForeground,
                        fontWeight: i == reached
                            ? FontWeight.w700
                            : FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              if (i < steps.length - 1) const SizedBox(width: 6),
            ],
          ],
        ),
      ],
    );
  }
}
