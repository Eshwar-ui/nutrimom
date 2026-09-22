import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/shell/shell_nav.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../../core/widgets/brand.dart';
import '../../auth/application/auth_controller.dart';
import '../../bag/presentation/bag_button.dart';
import '../../catalog/application/browse_controller.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/presentation/widgets/category_rail.dart';
import '../../catalog/presentation/widgets/listing_card.dart';
import '../../pillars/presentation/widgets/home_pillars.dart';

/// The app's front door, built from the same pictures and tokens as the web
/// home page so the two read as one product.
///
/// The four-pillar grid and the stage selector are not here yet: they belong
/// with the pillar screens (yoga, nutrition, community), which land in P3. A
/// pillar card that goes nowhere would be worse than no pillar card.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final auth = ref.watch(authControllerProvider);
    final latest = ref.watch(latestListingsProvider);
    final categories = ref.watch(categoriesProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(latestListingsProvider);
          ref.invalidate(categoriesProvider);
          await ref.read(latestListingsProvider.future);
        },
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: _Hero()),
            // The ecosystem first (brief §3): stage, pillars, then price.
            // The marketplace follows as the fourth pillar, not the identity.
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: StageSelector(),
              ),
            ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 36, 20, 0),
                child: PillarGrid(),
              ),
            ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 22, 20, 0),
                child: AffordableSupport(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Preloved marketplace',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 14),
                    _SearchBar(onTap: () => context.goTab(AppTab.shop)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 26, 20, 14),
                child: Text(
                  'Shop by category',
                  style: theme.textTheme.headlineSmall,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: categories.when(
                loading: () => const SizedBox(height: 152),
                error: (_, _) => const SizedBox.shrink(),
                data: (items) => CategoryRail(categories: items),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 34, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Latest listings',
                      style: theme.textTheme.headlineSmall,
                    ),
                    TextButton(
                      onPressed: () {
                        ref.read(browseQueryProvider.notifier).reset();
                        context.goTab(AppTab.shop);
                      },
                      child: const Text('Shop all'),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: AsyncView(
                value: latest,
                onRetry: () => ref.invalidate(latestListingsProvider),
                data: (items) => items.isEmpty
                    ? const EmptyView(
                        title: 'No items yet',
                        body: 'New listings appear here as soon as they are approved.',
                        icon: Icons.inventory_2_outlined,
                      )
                    : Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: ListingGrid(
                          listings: items,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                        ),
                      ),
              ),
            ),
            SliverToBoxAdapter(child: _WhyPreloved(signedIn: auth.isSignedIn)),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 34, 20, 0),
                child: VillageBand(),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: MediaQuery.paddingOf(context).bottom + 32,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The web's page backdrop, used as a decorative header band.
///
/// `bg-mobile.png` is 568x1200: a full-page background whose art is a wave and
/// a sun across the top, with the rest left empty for content to sit on. Sized
/// as a 300pt hero it rendered as a thin strip of drawing above a large empty
/// field, which pushed the headline halfway down the screen. Only the drawn
/// band is shown, and the headline sits under it on the page ground.
class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final topInset = MediaQuery.paddingOf(context).top;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Stack(
          children: [
            SizedBox(
              height: topInset + 96,
              width: double.infinity,
              child: Image.asset(
                'assets/images/bg-mobile.png',
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                excludeFromSemantics: true,
              ),
            ),
            // Home has no app bar, so the bag sits on the art band, on its own
            // ground so it reads against the drawing.
            Positioned(
              top: topInset + 6,
              right: 14,
              child: const BagButton(onDark: true),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Motherhood is a journey.\nYou don't have to do it alone.",
                style: theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                kBrandLine,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: t.accentText,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(NmTokens.radiusXl),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(NmTokens.radiusXl),
          border: Border.all(color: t.border, width: 2),
        ),
        child: Row(
          children: [
            Icon(Icons.search, size: 20, color: t.mutedForeground),
            const SizedBox(width: 10),
            Text(
              'Search preloved baby & maternity',
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(color: t.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}

/// The marketplace's own promise, on the banner the web uses for it.
class _WhyPreloved extends StatelessWidget {
  const _WhyPreloved({required this.signedIn});

  final bool signedIn;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 38, 20, 0),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface2,
          borderRadius: BorderRadius.circular(NmTokens.radius3xl),
          border: Border.all(color: t.border, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.asset(
                'assets/images/marketplace-benefits-banner.png',
                fit: BoxFit.cover,
                excludeFromSemantics: true,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Loved before. Loved again.',
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Buy, sell or pass on gently used baby and maternity essentials with '
                    'verified moms across India.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: t.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 18),
                  // Signed in, the next thing this card can offer is selling.
                  // "Your account" was left over from before the tab bar,
                  // and pushed Account into the Home tab besides.
                  FilledButton(
                    onPressed: () => signedIn
                        ? context.goTab(AppTab.sell)
                        : context.push('/register'),
                    child: Text(
                      signedIn ? 'Sell an item' : 'Create an account',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
