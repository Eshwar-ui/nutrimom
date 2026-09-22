import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../contracts/money.dart';
import '../../../core/shell/shell_nav.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/presentation/widgets/listing_image.dart';
import '../application/bag_controller.dart';

class BagScreen extends ConsumerWidget {
  const BagScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final items = ref.watch(bagProvider);
    final total = bagTotalPaise(items);

    return Scaffold(
      appBar: AppBar(title: const Text('Your bag')),
      body: items.isEmpty
          ? ListView(
              children: [
                EmptyView(
                  title: 'Your bag is empty',
                  body: 'Add something you love and it waits here until you check out.',
                  icon: Icons.shopping_bag_outlined,
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
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              children: [
                for (final item in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _Row(item: item),
                  ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: t.surface2,
                    borderRadius: BorderRadius.circular(NmTokens.radiusXl),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Total',
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          Text(
                            formatPaise(total),
                            style: theme.textTheme.headlineSmall?.copyWith(
                              color: t.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Said up front, because it is the first question a
                      // buyer used to COD asks, and the answer changed.
                      Text(
                        'Paid online at checkout: UPI, cards and netbanking. Items are not held '
                        'until you check out, so another buyer can still get there first.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: t.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      bottomNavigationBar: items.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: FilledButton(
                  onPressed: () {
                    final signedIn = ref
                        .read(authControllerProvider)
                        .isSignedIn;
                    context.push(
                      signedIn
                          ? '/checkout'
                          : '/login?next=${Uri.encodeComponent('/checkout')}',
                    );
                  },
                  child: Text('Checkout · ${formatPaise(total)}'),
                ),
              ),
            ),
    );
  }
}

class _Row extends ConsumerWidget {
  const _Row({required this.item});

  final BagItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return InkWell(
      onTap: () => context.push('/listings/${item.listingId}'),
      borderRadius: BorderRadius.circular(NmTokens.radiusXl),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(NmTokens.radiusXl),
          border: Border.all(color: t.border, width: 2),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 76,
                height: 76,
                child: ListingImage(url: item.image, semanticLabel: item.title),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.sellerName} · ${item.city}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: t.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatPaise(item.priceInPaise),
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: t.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: () =>
                  ref.read(bagProvider.notifier).remove(item.listingId),
              tooltip: 'Remove ${item.title}',
              icon: Icon(Icons.close, color: t.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}
