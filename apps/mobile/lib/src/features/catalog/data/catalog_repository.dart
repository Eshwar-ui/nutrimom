import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/listing_query.dart';
import '../../../contracts/models/listing.dart';
import '../../../core/network/api_client.dart';

/// Everything the buyer-facing catalog reads.
class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<Paginated<Listing>> browse(ListingQuery query, {int page = 1}) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/listings',
      query: query.toQueryParameters(page),
      // Browsing works signed out — that is the whole point of R2.5.
      authed: false,
    );
    return Paginated.fromJson(json, Listing.fromJson);
  }

  /// The detail route is token-aware rather than public: an admin reviewing a
  /// PENDING listing and a seller previewing their own both need to open it.
  /// So this one goes out authenticated when there is a session.
  Future<Listing> detail(String id) async {
    final json = await _api.get<Map<String, dynamic>>('/listings/$id');
    return Listing.fromJson(json);
  }

  /// Requires auth — the number is PII and must not be scrapeable by walking
  /// listing ids.
  Future<SellerContact> contact(String listingId) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/listings/$listingId/contact',
    );
    return SellerContact.fromJson(json);
  }

  Future<List<Category>> categories() async {
    final json = await _api.get<List<dynamic>>('/categories', authed: false);
    return json
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<SellerProfile> sellerProfile(String id) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/sellers/$id',
      authed: false,
    );
    return SellerProfile.fromJson(json);
  }

  Future<List<Review>> sellerReviews(String id) async {
    final json = await _api.get<List<dynamic>>(
      '/sellers/$id/reviews',
      authed: false,
    );
    return json
        .map((e) => Review.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(apiClientProvider));
});
