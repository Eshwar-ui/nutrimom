import '../enums.dart';
import '../listing_image.dart';

/// Mirror of `Category` in `packages/shared`.
class Category {
  const Category({required this.id, required this.name, required this.slug});

  final String id;
  final String name;
  final String slug;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as String,
    name: json['name'] as String,
    slug: json['slug'] as String,
  );
}

/// Mirror of `SellerInfo`.
///
/// Note what is *not* here: the WhatsApp number. It is PII and this type comes
/// back from unauthenticated endpoints, so the number is fetched separately
/// from `GET /listings/:id/contact` behind auth. [hasWhatsapp] is the flag that
/// says whether that call is worth making.
class SellerInfo {
  const SellerInfo({
    required this.id,
    required this.name,
    this.city,
    required this.hasWhatsapp,
    required this.isSellerVerified,
  });

  final String id;
  final String name;
  final String? city;
  final bool hasWhatsapp;
  final bool isSellerVerified;

  factory SellerInfo.fromJson(Map<String, dynamic> json) => SellerInfo(
    id: json['id'] as String,
    name: json['name'] as String,
    city: json['city'] as String?,
    hasWhatsapp: json['hasWhatsapp'] as bool? ?? false,
    isSellerVerified: json['isSellerVerified'] as bool? ?? false,
  );
}

/// Mirror of `SellerContact`.
class SellerContact {
  const SellerContact({this.whatsappNumber});

  final String? whatsappNumber;

  factory SellerContact.fromJson(Map<String, dynamic> json) =>
      SellerContact(whatsappNumber: json['whatsappNumber'] as String?);
}

/// Mirror of `Listing`. Prices are integer paise.
class Listing {
  const Listing({
    required this.id,
    required this.title,
    required this.description,
    required this.condition,
    this.originalPriceInPaise,
    required this.sellingPriceInPaise,
    this.purchaseDate,
    this.usageDuration,
    this.reasonForSelling,
    required this.city,
    required this.deliveryOption,
    required this.images,
    required this.rawImages,
    required this.status,
    this.rejectionReason,
    required this.isFeatured,
    required this.category,
    required this.seller,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final Condition condition;
  final int? originalPriceInPaise;
  final int sellingPriceInPaise;
  final DateTime? purchaseDate;
  final String? usageDuration;
  final String? reasonForSelling;
  final String city;
  final DeliveryOption deliveryOption;

  /// Loadable, absolute image URLs — see [resolveListingImages]. This is what
  /// the UI uses; it can be shorter than [rawImages] when a row holds a URL
  /// this client will not load.
  final List<String> images;

  /// Exactly what the API sent, kept so the mirror stays faithful to the wire
  /// and so a dropped image is diagnosable rather than invisible.
  final List<String> rawImages;

  final ListingStatus status;
  final String? rejectionReason;
  final bool isFeatured;
  final Category category;
  final SellerInfo seller;
  final DateTime createdAt;

  String? get coverImage => images.isEmpty ? null : images.first;

  /// Only an APPROVED listing can be bought. RESERVED means another buyer is
  /// mid-checkout and holds it; SOLD is gone. Both stay readable — a shared
  /// link should show the item, not a 404 — but neither is purchasable.
  bool get isBuyable => status == ListingStatus.approved;

  /// A discount is only meaningful if the seller actually recorded what they
  /// paid, and only if it is above what they are asking.
  int? get discountPercent {
    final original = originalPriceInPaise;
    if (original == null || original <= sellingPriceInPaise || original <= 0) {
      return null;
    }
    return (((original - sellingPriceInPaise) / original) * 100).round();
  }

  factory Listing.fromJson(Map<String, dynamic> json) => Listing(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String,
    condition: Condition.parse(json['condition'] as String),
    originalPriceInPaise: (json['originalPriceInPaise'] as num?)?.toInt(),
    sellingPriceInPaise: (json['sellingPriceInPaise'] as num).toInt(),
    purchaseDate: _date(json['purchaseDate']),
    usageDuration: json['usageDuration'] as String?,
    reasonForSelling: json['reasonForSelling'] as String?,
    city: json['city'] as String? ?? '',
    deliveryOption: DeliveryOption.parse(json['deliveryOption'] as String),
    images: resolveListingImages(
      (json['images'] as List<dynamic>? ?? const []).map((e) => e.toString()),
    ),
    rawImages: (json['images'] as List<dynamic>? ?? const [])
        .map((e) => e.toString())
        .toList(growable: false),
    status: ListingStatus.parse(json['status'] as String),
    rejectionReason: json['rejectionReason'] as String?,
    isFeatured: json['isFeatured'] as bool? ?? false,
    category: Category.fromJson(json['category'] as Map<String, dynamic>),
    seller: SellerInfo.fromJson(json['seller'] as Map<String, dynamic>),
    createdAt: _date(json['createdAt']) ?? DateTime.now(),
  );

  static DateTime? _date(Object? v) =>
      v is String ? DateTime.tryParse(v)?.toLocal() : null;
}

/// Mirror of `Paginated<T>`.
class Paginated<T> {
  const Paginated({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  final List<T> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  bool get hasMore => page < totalPages;

  factory Paginated.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) itemFromJson,
  ) => Paginated(
    items: (json['items'] as List<dynamic>? ?? const [])
        .map((e) => itemFromJson(e as Map<String, dynamic>))
        .toList(growable: false),
    page: (json['page'] as num?)?.toInt() ?? 1,
    pageSize: (json['pageSize'] as num?)?.toInt() ?? 0,
    total: (json['total'] as num?)?.toInt() ?? 0,
    totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
  );
}

/// Mirror of `SellerProfile`.
class SellerProfile {
  const SellerProfile({
    required this.id,
    required this.name,
    this.city,
    this.bio,
    required this.isSellerVerified,
    required this.memberSince,
    required this.listings,
    this.averageRating,
    required this.reviewCount,
  });

  final String id;
  final String name;
  final String? city;
  final String? bio;
  final bool isSellerVerified;
  final DateTime memberSince;
  final List<Listing> listings;
  final double? averageRating;
  final int reviewCount;

  factory SellerProfile.fromJson(Map<String, dynamic> json) => SellerProfile(
    id: json['id'] as String,
    name: json['name'] as String,
    city: json['city'] as String?,
    bio: json['bio'] as String?,
    isSellerVerified: json['isSellerVerified'] as bool? ?? false,
    memberSince: Listing._date(json['memberSince']) ?? DateTime.now(),
    listings: (json['listings'] as List<dynamic>? ?? const [])
        .map((e) => Listing.fromJson(e as Map<String, dynamic>))
        .toList(growable: false),
    averageRating: (json['averageRating'] as num?)?.toDouble(),
    reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
  );
}

/// Mirror of `Review`.
class Review {
  const Review({
    required this.id,
    required this.orderId,
    required this.listingId,
    required this.listingTitle,
    required this.reviewerName,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  final String id;
  final String orderId;
  final String listingId;
  final String listingTitle;
  final String reviewerName;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  factory Review.fromJson(Map<String, dynamic> json) => Review(
    id: json['id'] as String,
    orderId: json['orderId'] as String? ?? '',
    listingId: json['listingId'] as String? ?? '',
    listingTitle: json['listingTitle'] as String? ?? '',
    reviewerName: json['reviewerName'] as String? ?? 'A buyer',
    rating: (json['rating'] as num).toInt(),
    comment: json['comment'] as String?,
    createdAt: Listing._date(json['createdAt']) ?? DateTime.now(),
  );
}
