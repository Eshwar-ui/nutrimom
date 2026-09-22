import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/listing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../application/catalog_providers.dart';
import 'widgets/listing_card.dart';

class SellerProfileScreen extends ConsumerWidget {
  const SellerProfileScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(sellerProfileProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('Seller')),
      body: AsyncView(
        value: profile,
        onRetry: () => ref.invalidate(sellerProfileProvider(id)),
        data: (seller) => _Profile(seller: seller),
      ),
    );
  }
}

class _Profile extends ConsumerWidget {
  const _Profile({required this.seller});

  final SellerProfile seller;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reviews = ref.watch(sellerReviewsProvider(seller.id));

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: context.tokens.sage.withValues(alpha: 0.4),
              child: Text(
                seller.name.characters.first.toUpperCase(),
                style: TextStyle(
                  fontSize: 20,
                  color: context.tokens.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          seller.name,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.headlineSmall,
                        ),
                      ),
                      if (seller.isSellerVerified) ...[
                        const SizedBox(width: 6),
                        Icon(
                          Icons.verified,
                          size: 18,
                          color: context.tokens.primary,
                        ),
                      ],
                    ],
                  ),
                  Text(
                    [
                      if ((seller.city ?? '').isNotEmpty) seller.city!,
                      'Selling since ${_monthYear(seller.memberSince)}',
                    ].join(' · '),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: context.tokens.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (seller.reviewCount > 0) ...[
          const SizedBox(height: 14),
          Row(
            children: [
              Icon(Icons.star_rounded, size: 18, color: context.tokens.gold),
              const SizedBox(width: 4),
              Text(
                seller.averageRating!.toStringAsFixed(1),
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(width: 6),
              Text(
                seller.reviewCount == 1
                    ? '1 review'
                    : '${seller.reviewCount} reviews',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: context.tokens.mutedForeground,
                ),
              ),
            ],
          ),
        ],
        if ((seller.bio ?? '').trim().isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(seller.bio!, style: theme.textTheme.bodyLarge),
        ],
        const SizedBox(height: 28),
        Text(
          seller.listings.isEmpty
              ? 'Listings'
              : seller.listings.length == 1
              ? '1 item for sale'
              : '${seller.listings.length} items for sale',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 14),
        if (seller.listings.isEmpty)
          const EmptyView(
            title: 'Nothing listed right now',
            body: 'This seller has no live items at the moment.',
            icon: Icons.inventory_2_outlined,
          )
        else
          ListingGrid(listings: seller.listings),
        const SizedBox(height: 28),
        // Reviews load separately: a slow or failed review fetch should not
        // hold back the profile and the items, which are the point of the page.
        reviews.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
          data: (items) => items.isEmpty
              ? const SizedBox.shrink()
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What buyers said',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    for (final review in items) _ReviewTile(review: review),
                  ],
                ),
        ),
      ],
    );
  }

  static String _monthYear(DateTime date) {
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
    return '${months[date.month - 1]} ${date.year}';
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              for (var i = 1; i <= 5; i++)
                Icon(
                  i <= review.rating
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 15,
                  color: i <= review.rating
                      ? context.tokens.gold
                      : context.tokens.border,
                ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.reviewerName,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          if ((review.comment ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(review.comment!, style: theme.textTheme.bodyMedium),
          ],
          if (review.listingTitle.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              'on ${review.listingTitle}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: context.tokens.mutedForeground,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
