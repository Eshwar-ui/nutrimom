import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../contracts/enums.dart';
import '../../../../contracts/models/listing.dart';
import '../../../../contracts/money.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../auth/application/auth_controller.dart';
import '../../../wishlist/application/wishlist_controller.dart';
import 'listing_image.dart';

class ListingCard extends ConsumerWidget {
  const ListingCard({super.key, required this.listing});

  final Listing listing;

  Future<void> _toggleSaved(BuildContext context, WidgetRef ref) async {
    if (!ref.read(authControllerProvider).isSignedIn) {
      context.push(
        '/login?next=${Uri.encodeComponent('/listings/${listing.id}')}',
      );
      return;
    }
    final error = await ref
        .read(wishlistIdsProvider.notifier)
        .toggle(listing.id);
    if (error != null && context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final saved =
        ref.watch(wishlistIdsProvider).value?.contains(listing.id) ?? false;
    final discount = listing.discountPercent;

    return InkWell(
      onTap: () => context.push('/listings/${listing.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ListingImage(
                    url: listing.coverImage,
                    semanticLabel: listing.title,
                  ),
                  // A held or sold item still shows — a link shared on WhatsApp
                  // should open the thing it names — but it says so on the card
                  // rather than letting someone tap through hopefully.
                  if (!listing.isBuyable)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: _Badge(
                        label: listing.status == ListingStatus.sold
                            ? 'Sold'
                            : 'On hold',
                        background: context.tokens.foreground.withValues(
                          alpha: 0.82,
                        ),
                        foreground: Colors.white,
                      ),
                    ),
                  if (listing.isBuyable && discount != null)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: _Badge(
                        label: '$discount% off',
                        background: context.tokens.accent,
                        foreground: Colors.white,
                      ),
                    ),
                  Positioned(
                    right: 2,
                    top: 2,
                    child: IconButton(
                      onPressed: () => _toggleSaved(context, ref),
                      tooltip: saved ? 'Remove from saved' : 'Save',
                      style: IconButton.styleFrom(
                        // A heart sits over photography, so it needs its own
                        // ground to stay visible on a pale image.
                        backgroundColor: context.tokens.surface.withValues(
                          alpha: 0.88,
                        ),
                        minimumSize: const Size(36, 36),
                        padding: EdgeInsets.zero,
                      ),
                      icon: Icon(
                        saved ? Icons.favorite : Icons.favorite_border,
                        size: 19,
                        color: saved
                            ? context.tokens.accentText
                            : context.tokens.mutedForeground,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            listing.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                formatPaise(listing.sellingPriceInPaise),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: context.tokens.primary,
                ),
              ),
              if (listing.originalPriceInPaise != null && discount != null) ...[
                const SizedBox(width: 6),
                Text(
                  formatPaise(listing.originalPriceInPaise!),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: context.tokens.mutedForeground,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 2),
          Text(
            '${listing.condition.label} · ${listing.city}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: context.tokens.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.background,
    required this.foreground,
  });

  final String label;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// The grid used by browse, the home rail and the seller profile, so the
/// three cannot drift into three different column counts and spacings.
class ListingGrid extends StatelessWidget {
  const ListingGrid({super.key, required this.listings, this.padding});

  final List<Listing> listings;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: padding ?? EdgeInsets.zero,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 18,
        childAspectRatio: 0.62,
      ),
      itemCount: listings.length,
      itemBuilder: (_, i) => ListingCard(listing: listings[i]),
    );
  }
}
