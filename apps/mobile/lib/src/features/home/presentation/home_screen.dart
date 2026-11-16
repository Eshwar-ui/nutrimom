import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
/// home page so the two read as one product: the stage selector and the four
/// pillars first, then the marketplace as the fourth of them.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final auth = ref.watch(authControllerProvider);
    final latest = ref.watch(latestListingsProvider);
    final categories = ref.watch(categoriesProvider);

    return Scaffold(
      body: _StatusBarScrim(
        child: RefreshIndicator(
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
              // On failure the rail collapses to nothing, and the heading goes
              // with it rather than announcing an empty section.
              if (!categories.hasError)
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
              SliverToBoxAdapter(
                child: _WhyPreloved(signedIn: auth.isSignedIn),
              ),
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
      ),
    );
  }
}

/// Height of the hero's drawn band below the status bar. The scrim waits for
/// exactly this much scroll, so it appears as the art leaves, not before.
const _heroArtHeight = 96.0;

/// Backs the status bar once the hero art has scrolled away.
///
/// Home has no app bar, so the hero's art runs up behind the clock, which is
/// the look. But with nothing taking over once it scrolls off, every heading
/// and card on the page slid under the clock and the battery and collided
/// with them. The scrim fades in at the point the art leaves.
class _StatusBarScrim extends StatefulWidget {
  const _StatusBarScrim({required this.child});

  final Widget child;

  @override
  State<_StatusBarScrim> createState() => _StatusBarScrimState();
}

class _StatusBarScrimState extends State<_StatusBarScrim> {
  final _covered = ValueNotifier(false);

  @override
  void dispose() {
    _covered.dispose();
    super.dispose();
  }

  bool _onScroll(ScrollNotification n) {
    // Only the page itself: the category rail and other horizontal lists
    // report their own offsets, which say nothing about what is under the
    // status bar.
    if (n.depth == 0 && n.metrics.axis == Axis.vertical) {
      _covered.value = n.metrics.pixels > _heroArtHeight;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      // Home has no app bar to set this, so it is pinned here, per brightness,
      // as the theme's app bar does for every other screen.
      value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Stack(
        children: [
          NotificationListener<ScrollNotification>(
            onNotification: _onScroll,
            child: widget.child,
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.paddingOf(context).top,
            child: IgnorePointer(
              child: ValueListenableBuilder<bool>(
                valueListenable: _covered,
                builder: (context, covered, _) => AnimatedOpacity(
                  opacity: covered ? 1 : 0,
                  duration: const Duration(milliseconds: 180),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: t.background,
                      border: Border(bottom: BorderSide(color: t.border)),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
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
              height: topInset + _heroArtHeight,
              width: double.infinity,
              child: Image.asset(
                'assets/images/bg-mobile.png',
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                excludeFromSemantics: true,
              ),
            ),
            // Home has no app bar, so the bag sits on the art band, on its own
            // ground so it reads against the drawing. Centred in the band: set
            // 6pt under the status bar it hid all of a small heart in the art
            // but its tip, which hung off the button like a speech-bubble tail.
            Positioned(
              top: topInset + (_heroArtHeight - 48) / 2,
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
