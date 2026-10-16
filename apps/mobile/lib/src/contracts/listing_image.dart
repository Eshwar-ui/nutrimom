import '../core/config/app_config.dart';

/// Turns whatever is in `Listing.images` into something this app can load.
///
/// Mirrors `isAllowedListingImage` in `apps/web/src/lib/listing-image.ts`,
/// which accepts exactly two shapes:
///
///  * a **root-relative path** such as `/images/category-toys.png`, served out
///    of the web app's `public/` directory — every seeded listing uses these;
///  * an absolute **Supabase Storage public URL**, which is what the seller
///    uploader writes.
///
/// The web resolves the first shape for free, because the browser is already
/// on that origin. An app is not on any origin, so a relative path renders as
/// nothing at all — which is how the first build of the browse screen came out
/// with a grid of placeholder icons over real listings. They are resolved here
/// against the web origin instead.
///
/// Anything else is dropped rather than attempted: an arbitrary URL out of the
/// database is not something to hand to an image loader, and the web applies
/// the same allowlist for the same reason.
String? resolveListingImage(String src) {
  final trimmed = src.trim();
  if (trimmed.isEmpty) return null;

  // Root-relative, but not protocol-relative (`//evil.example/x.png`).
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return '${AppConfig.webBaseUrl}$trimmed';
  }

  final uri = Uri.tryParse(trimmed);
  if (uri == null) return null;
  if (uri.scheme == 'https' &&
      RegExp(r'^[^.]+\.supabase\.co$').hasMatch(uri.host) &&
      uri.path.startsWith('/storage/v1/object/public/')) {
    return trimmed;
  }
  return null;
}

/// The loadable images for a listing, in order.
///
/// Returns an empty list rather than a fallback URL when nothing survives:
/// `ListingImage` already draws a neutral placeholder, and fetching a
/// placeholder over the network to say "no photo" is a round trip that buys
/// nothing on a metered connection.
List<String> resolveListingImages(Iterable<String> images) =>
    images.map(resolveListingImage).whereType<String>().toList(growable: false);
