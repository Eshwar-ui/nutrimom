import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/listing_query.dart';
import '../../../contracts/models/listing.dart';
import '../data/catalog_repository.dart';

/// Categories change rarely and are needed by the home rail, the filter sheet
/// and the browse chips, so they are fetched once and shared.
final categoriesProvider = FutureProvider<List<Category>>((ref) {
  return ref.watch(catalogRepositoryProvider).categories();
});

/// The home page's "Latest listings" — newest approved items, first page only.
final latestListingsProvider = FutureProvider<List<Listing>>((ref) async {
  final page = await ref
      .watch(catalogRepositoryProvider)
      .browse(const ListingQuery());
  return page.items.take(6).toList(growable: false);
});

final listingDetailProvider = FutureProvider.family<Listing, String>((ref, id) {
  return ref.watch(catalogRepositoryProvider).detail(id);
});

final sellerProfileProvider = FutureProvider.family<SellerProfile, String>((
  ref,
  id,
) {
  return ref.watch(catalogRepositoryProvider).sellerProfile(id);
});

final sellerReviewsProvider = FutureProvider.family<List<Review>, String>((
  ref,
  id,
) {
  return ref.watch(catalogRepositoryProvider).sellerReviews(id);
});
