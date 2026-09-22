import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/listing_query.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../application/browse_controller.dart';
import '../application/catalog_providers.dart';
import 'filters_sheet.dart';
import 'widgets/listing_card.dart';

class BrowseScreen extends ConsumerStatefulWidget {
  const BrowseScreen({super.key});

  @override
  ConsumerState<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends ConsumerState<BrowseScreen> {
  final _scrollController = ScrollController();
  late final TextEditingController _search;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController(
      text: ref.read(browseQueryProvider).search ?? '',
    );
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    _search.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Fetch a screen early rather than at the very bottom, so the next rows
    // are usually already there by the time the thumb gets to them.
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 600) {
      ref.read(browseProvider.notifier).loadMore();
    }
  }

  void _onSearchChanged(String value) {
    // Debounced: the search hits the database on every keystroke otherwise,
    // and on a slow connection the results visibly chase the typing.
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(browseQueryProvider.notifier).setSearch(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(browseQueryProvider);
    final browse = ref.watch(browseProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Shop preloved')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
            child: TextField(
              controller: _search,
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              onSubmitted: (v) {
                _debounce?.cancel();
                ref.read(browseQueryProvider.notifier).setSearch(v);
              },
              decoration: InputDecoration(
                hintText: 'Search strollers, carriers, clothes…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: query.hasSearch
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _debounce?.cancel();
                          _search.clear();
                          ref
                              .read(browseQueryProvider.notifier)
                              .setSearch(null);
                        },
                      )
                    : null,
              ),
            ),
          ),
          _FilterBar(query: query),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(browseProvider.notifier).refresh(),
              child: AsyncView(
                value: browse,
                onRetry: () => ref.invalidate(browseProvider),
                data: (state) {
                  if (state.isEmpty) {
                    return ListView(
                      children: [
                        EmptyView(
                          title: 'Nothing matches that yet',
                          body: query.activeFilterCount > 0 || query.hasSearch
                              ? 'Try widening the filters — preloved stock changes daily.'
                              : 'New listings appear here as soon as they are approved.',
                          action: query.activeFilterCount > 0
                              ? OutlinedButton(
                                  onPressed: () => ref
                                      .read(browseQueryProvider.notifier)
                                      .clearFilters(),
                                  child: const Text('Clear filters'),
                                )
                              : null,
                        ),
                      ],
                    );
                  }
                  return ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                    children: [
                      Text(
                        state.total == 1 ? '1 item' : '${state.total} items',
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: context.tokens.mutedForeground),
                      ),
                      const SizedBox(height: 12),
                      ListingGrid(listings: state.items),
                      if (state.loadingMore)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      if (state.loadMoreError != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          child: Column(
                            children: [
                              Text(
                                state.loadMoreError!,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const SizedBox(height: 10),
                              OutlinedButton(
                                onPressed: () => ref
                                    .read(browseProvider.notifier)
                                    .loadMore(),
                                child: const Text('Load more'),
                              ),
                            ],
                          ),
                        ),
                      if (!state.hasMore && state.items.length > 6)
                        Padding(
                          padding: const EdgeInsets.only(top: 28),
                          child: Center(
                            child: Text(
                              "That's everything for now",
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: context.tokens.mutedForeground,
                                  ),
                            ),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends ConsumerWidget {
  const _FilterBar({required this.query});

  final ListingQuery query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider).value ?? const [];
    final categoryName = query.category == null
        ? null
        : categories
              .where((c) => c.slug == query.category)
              .map((c) => c.name)
              .firstOrNull;

    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          ActionChip(
            avatar: const Icon(Icons.tune, size: 17),
            label: Text(
              query.activeFilterCount == 0
                  ? 'Filters'
                  : 'Filters (${query.activeFilterCount})',
            ),
            onPressed: () => showFiltersSheet(context, ref),
          ),
          const SizedBox(width: 8),
          ActionChip(
            avatar: const Icon(Icons.swap_vert, size: 17),
            label: Text(query.sort.label),
            onPressed: () => _pickSort(context, ref),
          ),
          if (categoryName != null) ...[
            const SizedBox(width: 8),
            InputChip(
              label: Text(categoryName),
              onDeleted: () =>
                  ref.read(browseQueryProvider.notifier).setCategory(null),
            ),
          ],
          if (query.condition != null) ...[
            const SizedBox(width: 8),
            InputChip(
              label: Text(query.condition!.label),
              onDeleted: () => ref
                  .read(browseQueryProvider.notifier)
                  .set(query.copyWith(clearCondition: true)),
            ),
          ],
          if (query.city != null) ...[
            const SizedBox(width: 8),
            InputChip(
              label: Text(query.city!),
              onDeleted: () => ref
                  .read(browseQueryProvider.notifier)
                  .set(query.copyWith(clearCity: true)),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _pickSort(BuildContext context, WidgetRef ref) async {
    final picked = await showModalBottomSheet<ListingSort>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final sort in ListingSort.values)
              ListTile(
                title: Text(sort.label),
                trailing: sort == query.sort
                    ? Icon(Icons.check, color: context.tokens.primary)
                    : null,
                onTap: () => Navigator.pop(ctx, sort),
              ),
          ],
        ),
      ),
    );
    if (picked != null) ref.read(browseQueryProvider.notifier).setSort(picked);
  }
}
