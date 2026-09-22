import 'enums.dart';

/// How listings are sorted. Mirrors the `sort` enum in `listingQuerySchema`.
enum ListingSort {
  newest('newest', 'Newest first'),
  priceAsc('price-asc', 'Price: low to high'),
  priceDesc('price-desc', 'Price: high to low');

  const ListingSort(this.wire, this.label);
  final String wire;
  final String label;
}

/// The browse query, mirroring `listingQuerySchema`.
///
/// The server caps `pageSize` at 60 and rejects anything larger with a 400 —
/// the web sitemap already documents that trap. [pageSize] here is well under
/// it and is not caller-settable for that reason.
class ListingQuery {
  const ListingQuery({
    this.category,
    this.condition,
    this.city,
    this.delivery,
    this.minPriceInPaise,
    this.maxPriceInPaise,
    this.search,
    this.featured,
    this.sort = ListingSort.newest,
  });

  /// Category *slug*, not id — the API matches on slug.
  final String? category;
  final Condition? condition;
  final String? city;
  final DeliveryOption? delivery;
  final int? minPriceInPaise;
  final int? maxPriceInPaise;
  final String? search;
  final bool? featured;
  final ListingSort sort;

  static const int pageSize = 20;

  /// Everything except the search term and the sort, which read as "how I'm
  /// looking" rather than "what I've narrowed to".
  int get activeFilterCount => [
    category,
    condition,
    city,
    delivery,
    minPriceInPaise,
    maxPriceInPaise,
  ].where((v) => v != null).length;

  bool get hasSearch => (search ?? '').trim().isNotEmpty;

  Map<String, dynamic> toQueryParameters(int page) => {
    'page': page,
    'pageSize': pageSize,
    'sort': sort.wire,
    'category': ?category,
    'condition': ?condition?.wire,
    'city': ?city,
    'delivery': ?delivery?.wire,
    'minPrice': ?minPriceInPaise,
    'maxPrice': ?maxPriceInPaise,
    if (hasSearch) 'search': search!.trim(),
    'featured': ?featured,
  };

  /// `null` is a real value for every field here, so a copy-with that takes
  /// plain optionals cannot express "clear this". Each clearable field gets an
  /// explicit flag instead of the usual sentinel dance.
  ListingQuery copyWith({
    String? category,
    bool clearCategory = false,
    Condition? condition,
    bool clearCondition = false,
    String? city,
    bool clearCity = false,
    DeliveryOption? delivery,
    bool clearDelivery = false,
    int? minPriceInPaise,
    bool clearMinPrice = false,
    int? maxPriceInPaise,
    bool clearMaxPrice = false,
    String? search,
    bool clearSearch = false,
    ListingSort? sort,
  }) {
    return ListingQuery(
      category: clearCategory ? null : (category ?? this.category),
      condition: clearCondition ? null : (condition ?? this.condition),
      city: clearCity ? null : (city ?? this.city),
      delivery: clearDelivery ? null : (delivery ?? this.delivery),
      minPriceInPaise: clearMinPrice
          ? null
          : (minPriceInPaise ?? this.minPriceInPaise),
      maxPriceInPaise: clearMaxPrice
          ? null
          : (maxPriceInPaise ?? this.maxPriceInPaise),
      search: clearSearch ? null : (search ?? this.search),
      featured: featured,
      sort: sort ?? this.sort,
    );
  }

  /// Keeps the search term and sort, drops the narrowing — which is what
  /// "Clear filters" means to someone who has typed a search.
  ListingQuery clearedFilters() => ListingQuery(search: search, sort: sort);

  @override
  bool operator ==(Object other) =>
      other is ListingQuery &&
      other.category == category &&
      other.condition == condition &&
      other.city == city &&
      other.delivery == delivery &&
      other.minPriceInPaise == minPriceInPaise &&
      other.maxPriceInPaise == maxPriceInPaise &&
      other.search == search &&
      other.featured == featured &&
      other.sort == sort;

  @override
  int get hashCode => Object.hash(
    category,
    condition,
    city,
    delivery,
    minPriceInPaise,
    maxPriceInPaise,
    search,
    featured,
    sort,
  );
}
