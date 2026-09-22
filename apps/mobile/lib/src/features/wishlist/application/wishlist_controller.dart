import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/listing.dart';
import '../../../core/network/api_exception.dart';
import '../../auth/application/auth_controller.dart';
import '../data/wishlist_repository.dart';

/// The saved listings themselves, for the Saved tab.
final wishlistProvider = FutureProvider<List<Listing>>((ref) async {
  // Rebuilds on sign-in and sign-out: a wishlist is per-account, and showing
  // the previous account's saves after a switch would be a privacy bug.
  final signedIn = ref.watch(
    authControllerProvider.select((s) => s.isSignedIn),
  );
  if (!signedIn) return const [];
  return ref.watch(wishlistRepositoryProvider).list();
});

/// Just the ids, for the heart on every card and detail screen.
class WishlistIdsNotifier extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() async {
    final signedIn = ref.watch(
      authControllerProvider.select((s) => s.isSignedIn),
    );
    if (!signedIn) return <String>{};
    return ref.watch(wishlistRepositoryProvider).ids();
  }

  bool contains(String listingId) => state.value?.contains(listingId) ?? false;

  /// Flips the heart immediately and reconciles with the server afterwards.
  ///
  /// Returns an error message when the toggle failed, so the caller can say so
  /// in context rather than leaving a heart that lies. A stale listing id gets
  /// a 404 from the API ("That item is no longer available"), which is a real
  /// case now that admins can take a live listing down.
  Future<String?> toggle(String listingId) async {
    final current = state.value ?? <String>{};
    final wasSaved = current.contains(listingId);
    final optimistic = {...current};
    wasSaved ? optimistic.remove(listingId) : optimistic.add(listingId);
    state = AsyncData(optimistic);

    try {
      final nowSaved = await ref
          .read(wishlistRepositoryProvider)
          .toggle(listingId);
      final reconciled = {...state.value ?? <String>{}};
      nowSaved ? reconciled.add(listingId) : reconciled.remove(listingId);
      state = AsyncData(reconciled);
      ref.invalidate(wishlistProvider);
      return null;
    } on ApiException catch (e) {
      state = AsyncData(current);
      return e.message;
    }
  }
}

final wishlistIdsProvider =
    AsyncNotifierProvider<WishlistIdsNotifier, Set<String>>(
      WishlistIdsNotifier.new,
    );
