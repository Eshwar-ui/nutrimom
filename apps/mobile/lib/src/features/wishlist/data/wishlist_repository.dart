import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/models/listing.dart';
import '../../../core/network/api_client.dart';

class WishlistRepository {
  WishlistRepository(this._api);

  final ApiClient _api;

  Future<List<Listing>> list() async {
    final json = await _api.get<List<dynamic>>('/wishlist');
    return json
        .map((e) => Listing.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<Set<String>> ids() async {
    final json = await _api.get<List<dynamic>>('/wishlist/ids');
    return json.map((e) => e.toString()).toSet();
  }

  /// Returns the resulting state, so the caller can reconcile an optimistic
  /// toggle against what the server actually decided.
  Future<bool> toggle(String listingId) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/wishlist/toggle',
      body: {'listingId': listingId},
    );
    return json['wishlisted'] as bool? ?? false;
  }
}

final wishlistRepositoryProvider = Provider<WishlistRepository>((ref) {
  return WishlistRepository(ref.watch(apiClientProvider));
});
