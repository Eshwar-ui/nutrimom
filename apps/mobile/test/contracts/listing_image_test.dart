import 'package:flutter_test/flutter_test.dart';
import 'package:nurture_moms/src/core/config/app_config.dart';
import 'package:nurture_moms/src/contracts/listing_image.dart';

/// Mirrors `isAllowedListingImage` in `apps/web/src/lib/listing-image.ts`.
///
/// Both shapes below are real production data: every seeded listing carries a
/// root-relative path, and the seller uploader writes Supabase public URLs.
void main() {
  group('resolveListingImage', () {
    test('resolves a root-relative path against the web origin', () {
      expect(
        resolveListingImage('/images/category-toys.png'),
        '${AppConfig.webBaseUrl}/images/category-toys.png',
      );
    });

    test('keeps a Supabase Storage public URL as-is', () {
      const url =
          'https://abcdef.supabase.co/storage/v1/object/public/listing-images/a.jpg';
      expect(resolveListingImage(url), url);
    });

    test('drops a protocol-relative URL', () {
      // `//host/x.png` starts with a slash but is not root-relative — treating
      // it as one would point the loader at an arbitrary host.
      expect(resolveListingImage('//evil.example/x.png'), isNull);
    });

    test('drops http, a non-Supabase host, and the wrong Supabase path', () {
      expect(
        resolveListingImage(
            'http://abcdef.supabase.co/storage/v1/object/public/x.jpg'),
        isNull,
      );
      expect(
        resolveListingImage(
            'https://evil.example/storage/v1/object/public/x.jpg'),
        isNull,
      );
      expect(
        resolveListingImage('https://abcdef.supabase.co/private/x.jpg'),
        isNull,
      );
      // A sub-subdomain must not pass the single-label host check.
      expect(
        resolveListingImage(
            'https://a.b.supabase.co/storage/v1/object/public/x.jpg'),
        isNull,
      );
    });

    test('drops junk and empty entries', () {
      expect(resolveListingImage(''), isNull);
      expect(resolveListingImage('   '), isNull);
      expect(resolveListingImage('not a url'), isNull);
    });
  });

  group('resolveListingImages', () {
    test('keeps order and silently drops what it cannot load', () {
      const supabase =
          'https://abcdef.supabase.co/storage/v1/object/public/listing-images/a.jpg';
      final resolved = resolveListingImages([
        '/images/one.png',
        'https://evil.example/two.png',
        supabase,
      ]);
      expect(resolved, [
        '${AppConfig.webBaseUrl}/images/one.png',
        supabase,
      ]);
    });

    test('returns empty rather than a network fallback', () {
      // ListingImage draws a local placeholder; fetching one over the network
      // to say "no photo" would be a round trip that buys nothing.
      expect(resolveListingImages(['nonsense']), isEmpty);
    });
  });
}
