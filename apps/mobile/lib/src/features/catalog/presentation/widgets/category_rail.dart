import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../contracts/models/listing.dart';
import '../../../../core/shell/shell_nav.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../application/browse_controller.dart';

/// Category art, mirroring `categoryArt` in the web home page.
///
/// Only five categories have drawn art on the web; the rest render as plain
/// pills there, and do the same here. Adding a placeholder illustration for
/// the others would look like a missing asset rather than a design.
const Map<String, String> kCategoryArt = {
  'baby-clothes': 'assets/images/category-baby-clothes.png',
  'toys': 'assets/images/category-toys.png',
  'strollers': 'assets/images/category-strollers.png',
  'car-seats': 'assets/images/category-car-seats.png',
  'high-chairs': 'assets/images/category-high-chairs.png',
};

/// The pastel wash behind each art tile. The web cycles the same five tints
/// through its category chips; keeping the order stable means a category keeps
/// its colour between sessions.
List<Color> _tints(NmTokens t) => [t.blush, t.sage, t.sky, t.lavender, t.beige];

/// Horizontal rail of illustrated category tiles, then plain pills for the
/// categories without art.
class CategoryRail extends ConsumerWidget {
  const CategoryRail({super.key, required this.categories});

  final List<Category> categories;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final illustrated = categories
        .where((c) => kCategoryArt.containsKey(c.slug))
        .toList();
    final plain = categories
        .where((c) => !kCategoryArt.containsKey(c.slug))
        .toList();
    final tints = _tints(t);

    void open(String slug) {
      ref.read(browseQueryProvider.notifier).setCategory(slug);
      context.goTab(AppTab.shop);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 152,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: illustrated.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final category = illustrated[i];
              return _ArtTile(
                label: category.name,
                asset: kCategoryArt[category.slug]!,
                wash: tints[i % tints.length],
                onTap: () => open(category.slug),
              );
            },
          ),
        ),
        if (plain.isNotEmpty) ...[
          const SizedBox(height: 14),
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: plain.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, i) => ActionChip(
                label: Text(plain[i].name),
                onPressed: () => open(plain[i].slug),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ArtTile extends StatelessWidget {
  const _ArtTile({
    required this.label,
    required this.asset,
    required this.wash,
    required this.onTap,
  });

  final String label;
  final String asset;
  final Color wash;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return SizedBox(
      width: 132,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 104,
              width: double.infinity,
              decoration: BoxDecoration(
                // The wash is lightened rather than used at full strength: the
                // art already carries colour, and two saturated layers fight.
                color: Color.alphaBlend(
                  wash.withValues(alpha: 0.55),
                  t.surface,
                ),
                borderRadius: BorderRadius.circular(NmTokens.radius2xl),
                border: Border.all(color: t.border, width: 2),
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset(
                asset,
                fit: BoxFit.cover,
                // Decorative: the label beneath already names the category, so
                // a screen reader announcing the drawing too would just repeat.
                excludeFromSemantics: true,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
