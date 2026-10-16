import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/shell/shell_nav.dart';
import '../../../core/widgets/async_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/presentation/widgets/listing_card.dart';
import '../application/wishlist_controller.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(
      authControllerProvider.select((s) => s.isSignedIn),
    );
    final saved = ref.watch(wishlistProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: !signedIn
          ? _SignedOut()
          : RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(wishlistProvider);
                ref.invalidate(wishlistIdsProvider);
                await ref.read(wishlistProvider.future);
              },
              child: AsyncView(
                value: saved,
                onRetry: () => ref.invalidate(wishlistProvider),
                data: (items) => items.isEmpty
                    ? ListView(
                        children: [
                          EmptyView(
                            title: 'Nothing saved yet',
                            body: 'Tap the heart on anything you want to come back to.',
                            icon: Icons.favorite_border,
                            action: OutlinedButton(
                              onPressed: () => context.goTab(AppTab.shop),
                              child: const Text('Browse preloved'),
                            ),
                          ),
                        ],
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                        children: [ListingGrid(listings: items)],
                      ),
              ),
            ),
    );
  }
}

class _SignedOut extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Saving is per-account, so this is a real requirement rather than a
    // nudge — but it is phrased as what the feature does, not as a wall.
    return ListView(
      children: [
        EmptyView(
          title: 'Sign in to save items',
          body: 'Your saved list follows your account, so it is there on every device.',
          icon: Icons.favorite_border,
          action: FilledButton(
            onPressed: () =>
                context.push('/login?next=${Uri.encodeComponent('/wishlist')}'),
            child: const Text('Sign in'),
          ),
        ),
      ],
    );
  }
}
