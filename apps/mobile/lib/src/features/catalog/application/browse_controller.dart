import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/listing_query.dart';
import '../../../contracts/models/listing.dart';
import '../../../core/network/api_exception.dart';
import '../data/catalog_repository.dart';

/// What the browse screen is currently narrowed to.
///
/// Held separately from the results so that changing a filter is a single
/// assignment and the results provider simply rebuilds — rather than the two
/// having to be kept in step by hand.
class BrowseQueryNotifier extends Notifier<ListingQuery> {
  @override
  ListingQuery build() => const ListingQuery();

  void set(ListingQuery query) => state = query;

  void setSearch(String? term) {
    final trimmed = (term ?? '').trim();
    state = trimmed.isEmpty
        ? state.copyWith(clearSearch: true)
        : state.copyWith(search: trimmed);
  }

  void setSort(ListingSort sort) => state = state.copyWith(sort: sort);

  void setCategory(String? slug) => state = slug == null
      ? state.copyWith(clearCategory: true)
      : state.copyWith(category: slug);

  void clearFilters() => state = state.clearedFilters();

  void reset() => state = const ListingQuery();
}

final browseQueryProvider = NotifierProvider<BrowseQueryNotifier, ListingQuery>(
  BrowseQueryNotifier.new,
);

class BrowseState {
  const BrowseState({
    required this.items,
    required this.page,
    required this.totalPages,
    required this.total,
    this.loadingMore = false,
    this.loadMoreError,
  });

  final List<Listing> items;
  final int page;
  final int totalPages;
  final int total;
  final bool loadingMore;

  /// A failed *next* page must not blow away the pages already on screen —
  /// someone six rows deep in a scroll loses their place and their patience.
  final String? loadMoreError;

  bool get hasMore => page < totalPages;
  bool get isEmpty => items.isEmpty;

  BrowseState copyWith({bool? loadingMore, String? loadMoreError}) =>
      BrowseState(
        items: items,
        page: page,
        totalPages: totalPages,
        total: total,
        loadingMore: loadingMore ?? this.loadingMore,
        loadMoreError: loadMoreError,
      );
}

class BrowseNotifier extends AsyncNotifier<BrowseState> {
  @override
  Future<BrowseState> build() async {
    // Watching the query is the whole reload mechanism: any filter change
    // rebuilds this provider from page 1, which is also what a person expects
    // after narrowing a search.
    final query = ref.watch(browseQueryProvider);
    final page = await ref.watch(catalogRepositoryProvider).browse(query);
    return BrowseState(
      items: page.items,
      page: page.page,
      totalPages: page.totalPages,
      total: page.total,
    );
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.loadingMore) return;

    state = AsyncData(current.copyWith(loadingMore: true));
    try {
      final next = await ref
          .read(catalogRepositoryProvider)
          .browse(ref.read(browseQueryProvider), page: current.page + 1);
      state = AsyncData(
        BrowseState(
          items: [...current.items, ...next.items],
          page: next.page,
          totalPages: next.totalPages,
          total: next.total,
        ),
      );
    } on ApiException catch (e) {
      state = AsyncData(
        current.copyWith(loadingMore: false, loadMoreError: e.message),
      );
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

final browseProvider = AsyncNotifierProvider<BrowseNotifier, BrowseState>(
  BrowseNotifier.new,
);
