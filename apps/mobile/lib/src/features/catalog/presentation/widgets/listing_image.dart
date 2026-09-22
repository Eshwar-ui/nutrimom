import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_tokens.dart';

/// A listing photo, cached on disk.
///
/// Caching is not a nicety here: the same items are scrolled past repeatedly
/// on a metered Indian mobile connection, and re-downloading a photo on every
/// scroll is the difference between the app feeling instant and feeling
/// broken. Every failure mode lands on the same neutral placeholder rather
/// than a broken-image glyph.
class ListingImage extends StatelessWidget {
  const ListingImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.semanticLabel,
  });

  final String? url;
  final BoxFit fit;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final src = url;
    if (src == null || src.isEmpty) return const _Placeholder();

    // The brand's product art is PNG with transparency, and decoding it at a
    // reduced size composites those pixels onto black unless something opaque
    // is behind. Without this the grid renders illustrations on black tiles.
    return ColoredBox(
      color: context.tokens.cream,
      child: CachedNetworkImage(
        imageUrl: src,
        fit: fit,
        // Decoded at display size rather than full resolution — a grid of
        // 10-megapixel phone photos would otherwise exhaust memory on a
        // mid-range Android device long before it runs out of listings.
        memCacheWidth: 900,
        placeholder: (_, _) => const _Placeholder(),
        errorWidget: (_, _, _) => const _Placeholder(broken: true),
        imageBuilder: (context, provider) => Semantics(
          label: semanticLabel,
          image: true,
          child: Image(image: provider, fit: fit),
        ),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({this.broken = false});

  final bool broken;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: context.tokens.muted,
      child: Center(
        child: Icon(
          broken ? Icons.image_not_supported_outlined : Icons.photo_outlined,
          color: context.tokens.border,
          size: 28,
        ),
      ),
    );
  }
}
