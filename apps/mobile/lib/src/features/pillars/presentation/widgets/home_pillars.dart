import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../contracts/enums.dart';
import '../../../../contracts/money.dart';
import '../../../../core/shell/shell_nav.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../pillar_content.dart';

/// The sections that turn the home screen from a shop into an ecosystem
/// entrance, mirroring `apps/web/src/components/home-pillars.tsx`. The brief
/// (§3) wants the four pillars obvious in the first screen: someone arriving
/// from a pregnancy-yoga reel should not scroll past a product grid to learn
/// that yoga exists.

/// Routes that belong to another tab are switched to, not pushed, so the Shop
/// and Sell tabs never end up duplicated inside Home.
void _open(BuildContext context, String route) {
  switch (route) {
    case '/sell':
      context.goTab(AppTab.sell);
    case '/listings':
      context.goTab(AppTab.shop);
    default:
      context.push(route);
  }
}

class StageSelector extends StatelessWidget {
  const StageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final rows = <Widget>[];
    for (var i = 0; i < kStages.length; i += 2) {
      rows.add(
        Padding(
          padding: EdgeInsets.only(bottom: i + 2 < kStages.length ? 12 : 0),
          // IntrinsicHeight makes both tiles in a row as tall as the taller
          // one. Without it each tile sized to its own text: the rows had
          // ragged bottoms, and a minimum height left the short tiles half
          // empty.
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: _StageTile(stage: kStages[i])),
                const SizedBox(width: 12),
                Expanded(
                  child: i + 1 < kStages.length
                      ? _StageTile(stage: kStages[i + 1])
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Where are you right now?', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(
          "Tell us your stage and we'll take you straight to the support that fits it.",
          style: theme.textTheme.bodyMedium?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 18),
        ...rows,
      ],
    );
  }
}

class _StageTile extends StatelessWidget {
  const _StageTile({required this.stage});

  final Stage stage;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    // The brief lists what each stage covers with middle dots. In a tile two
    // columns wide those wrap, and a line ending on a bare "·" reads as a
    // rendering fault. A comma at a line end reads as ordinary punctuation.
    final covers = stage.covers.replaceAll(' · ', ', ');

    return Semantics(
      button: true,
      label: '${stage.label}. $covers',
      excludeSemantics: true,
      child: InkWell(
        onTap: () => _open(context, stage.route),
        borderRadius: BorderRadius.circular(NmTokens.radiusXl),
        child: Container(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(NmTokens.radiusXl),
            border: Border.all(color: t.border, width: 2),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // The art sits on its own panel, so the tile reads as a picture
              // first and a label second, which is the order a person scanning
              // for their stage looks at it. The panel is one neutral cream:
              // each drawing already stands on a pastel blob of its own, and a
              // second colour behind it (a pink blob on sage, a blue one on
              // blush) made two colour fields per tile fight, six times over.
              Container(
                height: 104,
                color: t.cream,
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 2),
                child: Image.asset(
                  stage.art,
                  fit: BoxFit.contain,
                  excludeFromSemantics: true,
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stage.label,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontFamily: 'Fraunces',
                          fontWeight: FontWeight.w600,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        covers,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: t.mutedForeground,
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(height: 8),
                      // The web tile says "Take me there". At two columns
                      // wide the arrow carries the same meaning in less room.
                      Align(
                        alignment: Alignment.centerRight,
                        child: Icon(
                          Icons.arrow_forward,
                          size: 18,
                          color: t.accentText,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Portrait pillar cards with the art in the corner, as on the web: name in
/// the display face, what it is in coral small caps, a line, the way in.
class PillarGrid extends StatelessWidget {
  const PillarGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'One place for your motherhood journey',
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Four kinds of support, built around the same idea: motherhood is easier when '
          'someone practical is in your corner.',
          style: theme.textTheme.bodyMedium?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 18),
        for (final pillar in kPillars)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _PillarCard(pillar: pillar),
          ),
      ],
    );
  }
}

class _PillarCard extends StatelessWidget {
  const _PillarCard({required this.pillar});

  final Pillar pillar;

  static const _pad = 20.0;
  static const _washSize = 200.0;
  static const _washOverhang = 40.0;

  /// How far the blurb stops short of the text column's right edge: clear of
  /// the wash circle's widest point, plus a gap. It was a flat 110, which left
  /// the longest line of every blurb running 30pt over the circle.
  static const _blurbInset = _washSize - _washOverhang - _pad + 10;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final wash = switch (pillar.key) {
      PillarKey.move => t.blush,
      PillarKey.nourish => t.sage,
      PillarKey.connect => t.sky,
      PillarKey.passItOn => t.lavender,
    };
    return InkWell(
      onTap: () => _open(context, pillar.route),
      borderRadius: BorderRadius.circular(NmTokens.radius2xl),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(NmTokens.radius2xl),
          border: Border.all(color: t.border, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // A soft wash in the art's corner gives each card its own
            // temperature without colouring the text side.
            Positioned(
              right: -_washOverhang,
              bottom: -_washOverhang,
              child: Container(
                width: _washSize,
                height: _washSize,
                decoration: BoxDecoration(
                  color: wash.withValues(alpha: 0.35),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              width: 150,
              height: 150,
              child: Image.asset(
                pillar.art,
                fit: BoxFit.contain,
                alignment: Alignment.bottomRight,
                excludeFromSemantics: true,
              ),
            ),
            // The card grows with its text rather than cutting it off: the
            // narrower blurb column wraps the longest blurb to five lines, and
            // larger accessibility text sizes need more still. IntrinsicHeight
            // resolves that height first, so the Spacer can still pin the call
            // to action to the bottom of shorter cards.
            IntrinsicHeight(
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 262),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(_pad, 18, _pad, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pillar.eyebrow,
                        style: theme.textTheme.displayMedium,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        pillar.title.toUpperCase(),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: t.accentText,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Kept clear of the art, which owns the right-hand corner.
                      Padding(
                        padding: const EdgeInsets.only(right: _blurbInset),
                        child: Text(
                          pillar.blurb,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: t.mutedForeground,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Spacer(),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            pillar.cta,
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: t.foreground,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(
                            Icons.arrow_forward,
                            size: 18,
                            color: t.foreground,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AffordableSupport extends StatelessWidget {
  const AffordableSupport({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final proof = affordableProof(
      formatPaise(MembershipPlan.monthly.priceInPaise),
    );
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: t.surface2,
        borderRadius: BorderRadius.circular(NmTokens.radius3xl),
        border: Border.all(color: t.border, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(kAffordableTitle, style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            kAffordableBody,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 18),
          for (final point in proof)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () => _open(context, point.route),
                borderRadius: BorderRadius.circular(NmTokens.radiusXl),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(18, 14, 14, 14),
                  decoration: BoxDecoration(
                    color: t.surface,
                    borderRadius: BorderRadius.circular(NmTokens.radiusXl),
                    border: Border.all(color: t.border, width: 2),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              point.figure,
                              style: theme.textTheme.headlineSmall,
                            ),
                            Text(
                              point.label,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: t.mutedForeground,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward, size: 20, color: t.accentText),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class VillageBand extends StatelessWidget {
  const VillageBand({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 26, 22, 24),
      decoration: BoxDecoration(
        color: t.primary,
        borderRadius: BorderRadius.circular(NmTokens.radius3xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Find your village',
            style: theme.textTheme.labelLarge?.copyWith(
              color: t.primaryForeground.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            kVillageTitle,
            style: theme.textTheme.headlineMedium?.copyWith(
              color: t.primaryForeground,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            kVillageBody,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: t.primaryForeground.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => context.push('/community'),
            style: FilledButton.styleFrom(
              backgroundColor: t.background,
              foregroundColor: t.foreground,
            ),
            child: const Text('Join the community'),
          ),
        ],
      ),
    );
  }
}
