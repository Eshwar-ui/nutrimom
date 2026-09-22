import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/models/listing.dart';
import '../../../contracts/money.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/shell/shell_nav.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../auth/application/auth_controller.dart';
import '../application/browse_controller.dart';
import '../application/catalog_providers.dart';
import '../data/catalog_repository.dart';
import 'widgets/listing_image.dart';

class ListingDetailScreen extends ConsumerWidget {
  const ListingDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listing = ref.watch(listingDetailProvider(id));

    return Scaffold(
      appBar: AppBar(),
      body: AsyncView(
        value: listing,
        onRetry: () => ref.invalidate(listingDetailProvider(id)),
        data: (item) => _Detail(listing: item),
      ),
    );
  }
}

class _Detail extends ConsumerWidget {
  const _Detail({required this.listing});

  final Listing listing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final discount = listing.discountPercent;

    return ListView(
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        _Gallery(images: listing.images, title: listing.title),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!listing.isBuyable) ...[
                _StatusNotice(status: listing.status),
                const SizedBox(height: 16),
              ],
              Text(listing.title, style: theme.textTheme.headlineMedium),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    formatPaise(listing.sellingPriceInPaise),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: context.tokens.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (listing.originalPriceInPaise != null &&
                      discount != null) ...[
                    const SizedBox(width: 10),
                    Text(
                      formatPaise(listing.originalPriceInPaise!),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: context.tokens.mutedForeground,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$discount% off',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: context.tokens.accent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Pill(
                    icon: Icons.verified_outlined,
                    label: listing.condition.label,
                  ),
                  _Pill(icon: Icons.place_outlined, label: listing.city),
                  _Pill(
                    icon: Icons.local_shipping_outlined,
                    label: listing.deliveryOption.label,
                  ),
                  ActionChip(
                    label: Text(listing.category.name),
                    onPressed: () {
                      ref
                          .read(browseQueryProvider.notifier)
                          .setCategory(listing.category.slug);
                      context.goTab(AppTab.shop);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('About this item', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(listing.description, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 20),
              // Only rendered when the seller actually filled it in. The web
              // app hit exactly this: a seeded listing with the literal string
              // "0" in usageDuration rendered as "Used for: 0".
              if ((listing.usageDuration ?? '').trim().isNotEmpty)
                _Fact(label: 'Used for', value: listing.usageDuration!),
              if (listing.purchaseDate != null)
                _Fact(
                  label: 'Bought',
                  value: _monthYear(listing.purchaseDate!),
                ),
              if ((listing.reasonForSelling ?? '').trim().isNotEmpty)
                _Fact(label: 'Why selling', value: listing.reasonForSelling!),
              const SizedBox(height: 16),
              _SellerCard(listing: listing),
            ],
          ),
        ),
      ],
    );
  }

  static String _monthYear(DateTime date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[date.month - 1]} ${date.year}';
  }
}

class _Gallery extends StatefulWidget {
  const _Gallery({required this.images, required this.title});

  final List<String> images;
  final String title;

  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.images.isEmpty ? <String?>[null] : widget.images;
    return AspectRatio(
      aspectRatio: 1,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: images.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) => ListingImage(
              url: images[i],
              semanticLabel: images.length > 1
                  ? '${widget.title}, photo ${i + 1} of ${images.length}'
                  : widget.title,
            ),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < images.length; i++)
                    Container(
                      width: 7,
                      height: 7,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: i == _index
                            ? context.tokens.primary
                            : Colors.white.withValues(alpha: 0.75),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StatusNotice extends StatelessWidget {
  const _StatusNotice({required this.status});

  final ListingStatus status;

  @override
  Widget build(BuildContext context) {
    final sold = status == ListingStatus.sold;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.tokens.muted,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.tokens.border),
      ),
      child: Text(
        sold
            ? 'This one has found a new home. Browse similar items — stock changes daily.'
            : 'Another buyer is checking out with this right now. If they do not complete it, '
                  'it comes back automatically within two days.',
        style: Theme.of(context).textTheme.bodyMedium,
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: context.tokens.muted,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: context.tokens.mutedForeground),
          const SizedBox(width: 6),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: context.tokens.mutedForeground,
              ),
            ),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _SellerCard extends ConsumerStatefulWidget {
  const _SellerCard({required this.listing});

  final Listing listing;

  @override
  ConsumerState<_SellerCard> createState() => _SellerCardState();
}

class _SellerCardState extends ConsumerState<_SellerCard> {
  bool _fetchingContact = false;

  Future<void> _contactSeller() async {
    final signedIn = ref.read(authControllerProvider).isSignedIn;
    if (!signedIn) {
      // The number is behind auth on the server, so asking first is honest
      // rather than letting the tap fail with a 401.
      final go = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Sign in to message the seller'),
          content: const Text(
            'Sellers share their WhatsApp number with signed-in buyers only, so it '
            'cannot be harvested from the listings.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Not now'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Sign in'),
            ),
          ],
        ),
      );
      if (go == true && mounted) {
        context.push(
          '/login?next=${Uri.encodeComponent('/listings/${widget.listing.id}')}',
        );
      }
      return;
    }

    setState(() => _fetchingContact = true);
    try {
      final contact = await ref
          .read(catalogRepositoryProvider)
          .contact(widget.listing.id);
      final number = contact.whatsappNumber;
      if (!mounted) return;
      if (number == null || number.trim().isEmpty) {
        _toast("This seller hasn't added a WhatsApp number yet.");
        return;
      }
      final url = Uri.parse(
        whatsappLink(
          number,
          'Hi! I saw your listing "${widget.listing.title}" on The Nurture Moms.',
        ),
      );
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        if (mounted) _toast("We couldn't open WhatsApp on this device.");
      }
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    } finally {
      if (mounted) setState(() => _fetchingContact = false);
    }
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final seller = widget.listing.seller;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: context.tokens.sage.withValues(alpha: 0.4),
                  child: Text(
                    seller.name.characters.first.toUpperCase(),
                    style: TextStyle(
                      color: context.tokens.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
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
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          if (seller.isSellerVerified) ...[
                            const SizedBox(width: 6),
                            Icon(
                              Icons.verified,
                              size: 16,
                              color: context.tokens.primary,
                            ),
                          ],
                        ],
                      ),
                      if ((seller.city ?? '').isNotEmpty)
                        Text(
                          seller.city!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.tokens.mutedForeground,
                          ),
                        ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/sellers/${seller.id}'),
                  child: const Text('View'),
                ),
              ],
            ),
            if (seller.hasWhatsapp) ...[
              const SizedBox(height: 14),
              OutlinedButton.icon(
                onPressed: _fetchingContact ? null : _contactSeller,
                icon: _fetchingContact
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2.2),
                      )
                    : const Icon(Icons.chat_outlined, size: 18),
                label: const Text('Ask the seller on WhatsApp'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
