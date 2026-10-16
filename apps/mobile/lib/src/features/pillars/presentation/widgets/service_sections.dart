import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_tokens.dart';
import '../../../booking/presentation/book_action.dart';
import '../../pillar_content.dart';

/// The building blocks every pillar screen shares, mirroring
/// `apps/web/src/components/service-sections.tsx` so the four screens speak
/// one visual language, as brief §13 asks.

/// Hero: art with the headline sitting on its empty upper wall (the yoga and
/// nutrition art is composed for exactly that), or a plain header without art.
class ServiceHero extends StatelessWidget {
  const ServiceHero({super.key, required this.page});

  final ServicePage page;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final text = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          page.eyebrow,
          style: theme.textTheme.labelLarge?.copyWith(color: t.accentText),
        ),
        const SizedBox(height: 6),
        Text(page.title, style: theme.textTheme.headlineLarge),
        const SizedBox(height: 10),
        Text(
          page.subtitle,
          style: theme.textTheme.bodyLarge?.copyWith(color: t.mutedForeground),
        ),
      ],
    );

    final image = page.heroImage;
    if (image == null) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
        child: text,
      );
    }

    final width = MediaQuery.sizeOf(context).width;
    return SizedBox(
      // Tall enough to keep the subject, which sits in the lower half.
      height: (width * 1.45).clamp(420.0, 640.0),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            image,
            fit: BoxFit.cover,
            alignment: Alignment.bottomCenter,
          ),
          // The art's upper wall is pale but not blank. A top wash keeps the
          // headline at full contrast wherever a sprig of leaves crosses it.
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  t.background.withValues(alpha: 0.92),
                  t.background.withValues(alpha: 0.55),
                  t.background.withValues(alpha: 0),
                ],
                stops: const [0, 0.32, 0.55],
              ),
            ),
          ),
          Positioned(left: 20, right: 20, top: 8, child: text),
        ],
      ),
    );
  }
}

class CredentialStrip extends StatelessWidget {
  const CredentialStrip({super.key, required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final item in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: t.border, width: 2),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified_outlined, size: 16, color: t.primary),
                const SizedBox(width: 6),
                Text(item, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
      ],
    );
  }
}

class SectionHeading extends StatelessWidget {
  const SectionHeading(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Text(text, style: Theme.of(context).textTheme.headlineSmall),
  );
}

/// Offerings as a single column of tinted rows rather than a grid: on a phone
/// a two-up grid of six cards cuts every description to three words.
class OfferingList extends StatelessWidget {
  const OfferingList({super.key, required this.items});

  final List<Offering> items;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final washes = [t.blush, t.sage, t.lavender, t.sky, t.beige];
    return Column(
      children: [
        for (var i = 0; i < items.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: items[i].route == null
                  ? null
                  : () => context.push(items[i].route!),
              borderRadius: BorderRadius.circular(NmTokens.radius2xl),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Color.alphaBlend(
                    washes[i % washes.length].withValues(alpha: 0.32),
                    t.surface,
                  ),
                  borderRadius: BorderRadius.circular(NmTokens.radius2xl),
                  border: Border.all(color: t.border, width: 2),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            items[i].title,
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            items[i].body,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: t.mutedForeground,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (items[i].route != null) ...[
                      const SizedBox(width: 10),
                      Icon(Icons.arrow_forward, size: 20, color: t.accentText),
                    ],
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// The inclusion list, set on one sheet with ticked items (mirrors the web's
/// "inclusion lists on one sheet" redesign): a list the reader is meant to run
/// down reads as a checklist, not as seven separate cards.
class IncludesList extends StatelessWidget {
  const IncludesList({super.key, required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 6),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
        border: Border.all(color: t.border, width: 2),
      ),
      child: Column(
        children: [
          for (final item in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    margin: const EdgeInsets.only(top: 1),
                    decoration: BoxDecoration(
                      color: Color.alphaBlend(
                        t.sage.withValues(alpha: 0.55),
                        t.surface,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.check, size: 15, color: t.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text(item, style: theme.textTheme.bodyLarge)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Prices as paper notes: one tinted note per price, with a strip of tape, a
/// tag badge, and a faint rupee watermark (mirrors the web's pricing redesign,
/// which borrows the testimonial cards' paper language).
///
/// "from" is set small and apart from the figure: it changes what the number
/// means, and at the figure's size it would read as part of the price.
class PaperPriceNotes extends StatelessWidget {
  const PaperPriceNotes({super.key, required this.rows, this.note});

  final List<PriceRow> rows;
  final String? note;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final washes = [t.blush, t.sky, t.sage, t.lavender, t.gold];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < rows.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: _Note(row: rows[i], wash: washes[i % washes.length]),
          ),
        if (note != null)
          Text(
            note!,
            style: theme.textTheme.bodySmall?.copyWith(
              color: t.mutedForeground,
            ),
          ),
      ],
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.row, required this.wash});

  final PriceRow row;
  final Color wash;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final spoken =
        '${row.label}, ${row.from ? 'from ' : ''}${row.price}${row.unit != null ? ' ${row.unit}' : ''}';
    return Semantics(
      // One announcement per note, "Group class, from ₹199 per class", rather
      // than four fragments read out of visual order.
      label: spoken,
      excludeSemantics: true,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 26, 20, 20),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: Color.alphaBlend(wash.withValues(alpha: 0.5), t.surface),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: wash.withValues(alpha: 0.9),
                width: 1.5,
              ),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  right: -6,
                  bottom: -34,
                  child: Text(
                    '₹',
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 92,
                      color: t.foreground.withValues(alpha: 0.06),
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row.label.toUpperCase(),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: t.accentText,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.end,
                      spacing: 6,
                      children: [
                        if (row.from)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 5),
                            child: Text(
                              'from',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ),
                        Text(row.price, style: theme.textTheme.displayMedium),
                        if (row.unit != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 5),
                            child: Text(
                              row.unit!,
                              style: theme.textTheme.bodyMedium,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Tape across the top edge.
          Positioned(
            top: -8,
            left: 22,
            child: Transform.rotate(
              angle: -0.035,
              child: Container(
                width: 64,
                height: 18,
                decoration: BoxDecoration(
                  color: t.surface.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(3),
                  border: Border.all(color: t.border),
                ),
              ),
            ),
          ),
          // Tag badge on the corner.
          Positioned(
            top: -10,
            right: -4,
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: Color.alphaBlend(
                  wash.withValues(alpha: 0.85),
                  t.surface,
                ),
                shape: BoxShape.circle,
                border: Border.all(color: t.background, width: 3),
              ),
              child: Icon(Icons.sell_outlined, size: 16, color: t.foreground),
            ),
          ),
        ],
      ),
    );
  }
}

class SafetyNote extends StatelessWidget {
  const SafetyNote({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Color.alphaBlend(t.sky.withValues(alpha: 0.35), t.surface),
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.health_and_safety_outlined, color: t.foreground, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

/// The closing block: one message, one action. The same action as the hero,
/// on purpose: a second CTA with a different intent at the bottom of a page
/// splits the decision the page exists to get made.
class ClosingCard extends StatelessWidget {
  const ClosingCard({super.key, required this.page});

  final ServicePage page;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Color.alphaBlend(t.sage.withValues(alpha: 0.35), t.surface),
        borderRadius: BorderRadius.circular(NmTokens.radius3xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(page.closingTitle, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            page.closingBody,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 18),
          BookButton(intent: page.intent, label: page.closingCta),
        ],
      ),
    );
  }
}
