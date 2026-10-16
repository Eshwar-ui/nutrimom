import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/money.dart';
import '../../../core/shell/shell_nav.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../catalog/presentation/widgets/listing_image.dart';
import '../data/orders_repository.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final orders = ref.watch(myOrdersProvider);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Your orders')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myOrdersProvider);
          await ref.read(myOrdersProvider.future);
        },
        child: AsyncView(
          value: orders,
          onRetry: () => ref.invalidate(myOrdersProvider),
          data: (list) => list.isEmpty
              ? ListView(
                  children: [
                    EmptyView(
                      title: 'No orders yet',
                      body: 'Everything you buy shows up here, with where it is on its way.',
                      icon: Icons.receipt_long_outlined,
                      action: OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          context.goTab(AppTab.shop);
                        },
                        child: const Text('Browse preloved'),
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final o = list[i];
                    final first = o.items.isEmpty ? null : o.items.first;
                    final more = o.items.length - 1;
                    return InkWell(
                      onTap: () => context.push('/orders/${o.id}'),
                      borderRadius: BorderRadius.circular(NmTokens.radiusXl),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: t.surface,
                          borderRadius: BorderRadius.circular(
                            NmTokens.radiusXl,
                          ),
                          border: Border.all(color: t.border, width: 2),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: SizedBox(
                                width: 64,
                                height: 64,
                                child: ListingImage(url: first?.image),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    first == null
                                        ? o.orderNumber
                                        : more > 0
                                        ? '${first.listingTitle} +$more more'
                                        : first.listingTitle,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${o.orderNumber} · ${o.createdAt.day} '
                                    '${months[o.createdAt.month - 1]}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: t.mutedForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  formatPaise(o.totalInPaise),
                                  style: theme.textTheme.titleMedium,
                                ),
                                const SizedBox(height: 4),
                                _StatusChip(
                                  status: o.status,
                                  method: o.paymentMethod,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status, required this.method});

  final OrderStatus status;
  final PaymentMethod method;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final bg = switch (status) {
      OrderStatus.pending => t.gold.withValues(alpha: 0.3),
      OrderStatus.cancelled => t.muted,
      _ => t.sage.withValues(alpha: 0.45),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        orderStatusLabel(status, method),
        style: Theme.of(context).textTheme.bodySmall
            ?.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }
}
