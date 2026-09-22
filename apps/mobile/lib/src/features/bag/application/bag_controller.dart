import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../contracts/models/listing.dart';

/// One bagged item. Preloved stock is single-unit, so there is no quantity,
/// mirroring the web's `CartItem`.
///
/// The price here is a snapshot for display only. The server re-prices on
/// `POST /orders` and the gateway charges the server's figure, so a stale
/// price in the bag can mislead the buyer's eye but never their card.
class BagItem {
  const BagItem({
    required this.listingId,
    required this.title,
    this.image,
    required this.priceInPaise,
    required this.city,
    required this.sellerId,
    required this.sellerName,
  });

  final String listingId;
  final String title;
  final String? image;
  final int priceInPaise;
  final String city;
  final String sellerId;
  final String sellerName;

  factory BagItem.fromListing(Listing l) => BagItem(
    listingId: l.id,
    title: l.title,
    image: l.coverImage,
    priceInPaise: l.sellingPriceInPaise,
    city: l.city,
    sellerId: l.seller.id,
    sellerName: l.seller.name,
  );

  Map<String, dynamic> toJson() => {
    'listingId': listingId,
    'title': title,
    'image': image,
    'priceInPaise': priceInPaise,
    'city': city,
    'sellerId': sellerId,
    'sellerName': sellerName,
  };

  factory BagItem.fromJson(Map<String, dynamic> j) => BagItem(
    listingId: j['listingId'] as String,
    title: j['title'] as String? ?? '',
    image: j['image'] as String?,
    priceInPaise: (j['priceInPaise'] as num).toInt(),
    city: j['city'] as String? ?? '',
    sellerId: j['sellerId'] as String? ?? '',
    sellerName: j['sellerName'] as String? ?? '',
  );
}

/// The bag, persisted on the device.
///
/// On-device rather than on the server because there is no server cart: the
/// order is the first server object, and it is created at checkout. That also
/// means the bag reserves nothing. Two buyers can bag the same stroller; the
/// first to reach checkout holds it for 30 minutes.
class BagController extends Notifier<List<BagItem>> {
  static const _key = 'nurture-bag';

  @override
  List<BagItem> build() {
    _load();
    return const [];
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      final list = (jsonDecode(raw) as List<dynamic>)
          .map((e) => BagItem.fromJson((e as Map).cast<String, dynamic>()))
          .toList(growable: false);
      state = list;
    } catch (_) {
      // A corrupt or old-format bag is not worth an error screen. Start empty.
      state = const [];
    }
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(state.map((e) => e.toJson()).toList()),
    );
  }

  bool contains(String listingId) => state.any((i) => i.listingId == listingId);

  void add(BagItem item) {
    if (contains(item.listingId)) return;
    state = [...state, item];
    _save();
  }

  void remove(String listingId) {
    state = state
        .where((i) => i.listingId != listingId)
        .toList(growable: false);
    _save();
  }

  /// Drops several at once, for items the server says are gone.
  void removeAll(Iterable<String> listingIds) {
    final drop = listingIds.toSet();
    state = state
        .where((i) => !drop.contains(i.listingId))
        .toList(growable: false);
    _save();
  }

  void clear() {
    state = const [];
    _save();
  }
}

final bagProvider = NotifierProvider<BagController, List<BagItem>>(
  BagController.new,
);

int bagTotalPaise(List<BagItem> items) =>
    items.fold(0, (sum, i) => sum + i.priceInPaise);
