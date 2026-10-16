import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../contracts/models/order.dart';
import '../../../contracts/money.dart';
import '../../../contracts/validators.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/brand.dart';
import '../../auth/application/auth_controller.dart';
import '../../bag/application/bag_controller.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../orders/data/orders_repository.dart';
import '../application/payment_outcome.dart';
import 'outcome_card.dart';

/// Address, summary, and the one call that creates the order.
///
/// This screen never takes payment. It creates the PENDING order (which
/// re-prices the items and holds them for 30 minutes) and hands off to the
/// order screen, which owns payment and every retry. See `payForOrder` for
/// why: an order created here twice is the bug this split avoids.
class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _line1 = TextEditingController();
  final _line2 = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();
  final _pin = TextEditingController();
  bool _busy = false;
  String? _notice;
  PaymentOutcome? _outcome;

  @override
  void initState() {
    super.initState();
    // Prefilled from the profile, never over what the buyer has typed. The web
    // hit a race here (prefill ran before the session loaded and left the
    // field blank); reading the resolved user once, up front, avoids it.
    final user = ref.read(authControllerProvider).user;
    _name.text = user?.name ?? '';
    final wa = (user?.whatsappNumber ?? '').trim();
    if (validateIndianMobile(wa) == null) _phone.text = wa;
    _city.text = user?.city ?? '';
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _line1, _line2, _city, _state, _pin]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    final items = ref.read(bagProvider);
    if (items.isEmpty) return;

    setState(() {
      _busy = true;
      _notice = null;
      _outcome = null;
    });

    final address = ShippingAddress(
      fullName: _name.text.trim(),
      phone: _phone.text.trim(),
      line1: _line1.text.trim(),
      line2: _line2.text.trim(),
      city: _city.text.trim(),
      state: _state.text.trim(),
      postalCode: _pin.text.trim(),
    );

    try {
      final order = await ref
          .read(ordersRepositoryProvider)
          .create(
            listingIds: items.map((i) => i.listingId).toList(),
            address: address,
          );
      // The items are now held by this order. Leaving them in the bag would
      // invite a second checkout that fails against the buyer's own hold.
      ref.read(bagProvider.notifier).clear();
      ref.invalidate(myOrdersProvider);
      if (!mounted) return;
      // `go`, not `push`: the order replaces the bag-and-checkout trail, so
      // Back from a paid order does not land on an empty bag.
      context.go('/orders/${order.id}?pay=1');
    } on ApiException catch (e) {
      await _handleCreateError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// A failed create means nothing was held and nothing was charged. The
  /// useful thing is to say which item is the problem and fix the bag.
  Future<void> _handleCreateError(ApiException e) async {
    final bag = ref.read(bagProvider.notifier);
    final me = ref.read(authControllerProvider).user?.id;

    if (e.message.contains("can't buy your own listing") && me != null) {
      final own = ref.read(bagProvider).where((i) => i.sellerId == me).toList();
      bag.removeAll(own.map((i) => i.listingId));
      setState(
        () => _notice =
            'Removed ${own.map((i) => '"${i.title}"').join(', ')}: that is your own listing.',
      );
      return;
    }

    final outcome = classifyPaymentError(e);
    if (outcome.kind == PaymentOutcomeKind.itemUnavailable) {
      // The server names one title; there may be more. Check each bagged item
      // and drop exactly the ones that can no longer be bought.
      final gone = <BagItem>[];
      for (final item in ref.read(bagProvider)) {
        try {
          final l = await ref
              .read(catalogRepositoryProvider)
              .detail(item.listingId);
          if (!l.isBuyable) gone.add(item);
        } on ApiException catch (err) {
          if (err.isNotFound) gone.add(item);
        }
      }
      bag.removeAll(gone.map((i) => i.listingId));
      if (!mounted) return;
      final left = ref.read(bagProvider).length;
      setState(
        () => _notice = gone.isEmpty
            ? e.message
            : 'Removed ${gone.map((i) => '"${i.title}"').join(', ')}: someone else got there '
                  'first. ${left == 0 ? 'Your bag is now empty.' : 'Check the total and try again.'} '
                  'Nothing was charged.',
      );
      return;
    }
    setState(() => _outcome = outcome);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final items = ref.watch(bagProvider);
    final total = bagTotalPaise(items);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: AutofillGroup(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              children: [
                Text('Delivery address', style: theme.textTheme.headlineSmall),
                const SizedBox(height: 14),
                _field(
                  _name,
                  'Full name',
                  validator: requiredField(
                    "Enter the recipient's full name",
                    min: 2,
                  ),
                  hints: const [AutofillHints.name],
                  caps: TextCapitalization.words,
                ),
                _field(
                  _phone,
                  'Mobile number',
                  validator: validateIndianMobile,
                  hints: const [AutofillHints.telephoneNumber],
                  keyboard: TextInputType.phone,
                  helper: 'The courier calls this number',
                ),
                _field(
                  _line1,
                  'House, street',
                  validator: requiredField('Enter your street address', min: 2),
                  hints: const [AutofillHints.streetAddressLine1],
                ),
                _field(
                  _line2,
                  'Area, landmark (optional)',
                  hints: const [AutofillHints.streetAddressLine2],
                ),
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        _city,
                        'City',
                        validator: requiredField('Enter your city'),
                        hints: const [AutofillHints.addressCity],
                        caps: TextCapitalization.words,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        _pin,
                        'PIN code',
                        validator: validatePostalCode,
                        hints: const [AutofillHints.postalCode],
                        keyboard: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                _field(
                  _state,
                  'State',
                  validator: requiredField('Enter your state'),
                  hints: const [AutofillHints.addressState],
                  caps: TextCapitalization.words,
                ),
                const SizedBox(height: 18),
                Text('Your order', style: theme.textTheme.headlineSmall),
                const SizedBox(height: 10),
                for (final i in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            i.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          formatPaise(i.priceInPaise),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                Divider(color: t.border),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text('Total', style: theme.textTheme.titleMedium),
                    ),
                    Text(
                      formatPaise(total),
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: t.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'You pay online on the next step. Placing the order holds these items for '
                  'you for about half an hour while you pay.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: t.mutedForeground,
                  ),
                ),
                if (_notice != null) ...[
                  const SizedBox(height: 16),
                  NoticeBanner(message: _notice!),
                ],
                if (_outcome != null) ...[
                  const SizedBox(height: 16),
                  OutcomeCard(outcome: _outcome!),
                ],
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          child: FilledButton(
            onPressed: _busy || items.isEmpty ? null : _placeOrder,
            child: _busy
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: t.primaryForeground,
                    ),
                  )
                : Text('Continue to pay · ${formatPaise(total)}'),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    String? Function(String?)? validator,
    List<String> hints = const [],
    TextInputType? keyboard,
    TextCapitalization caps = TextCapitalization.none,
    String? helper,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        decoration: InputDecoration(labelText: label, helperText: helper),
        validator: validator,
        autofillHints: hints,
        keyboardType: keyboard,
        textCapitalization: caps,
        textInputAction: TextInputAction.next,
      ),
    );
  }
}
