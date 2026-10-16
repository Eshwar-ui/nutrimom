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
        // Two columns: six stages stacked one per row push the pillars below
        // the second screen, and the labels are short enough to share a row.
        LayoutBuilder(
          builder: (context, c) {
            final w = (c.maxWidth - 12) / 2;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final stage in kStages)
                  SizedBox(
                    width: w,
                    child: _StageTile(stage: stage),
                  ),
              ],
            );
          },
        ),
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
    return InkWell(
      onTap: () => _open(context, stage.route),
      borderRadius: BorderRadius.circular(NmTokens.radiusXl),
      child: Container(
        constraints: const BoxConstraints(minHeight: 128),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(NmTokens.radiusXl),
          border: Border.all(color: t.border, width: 2),
        ),
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
            const SizedBox(height: 6),
            Text(
              stage.covers,
              style: theme.textTheme.bodySmall?.copyWith(
                color: t.mutedForeground,
              ),
            ),
          ],
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
        height: 262,
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
              right: -40,
              bottom: -40,
              child: Container(
                width: 200,
                height: 200,
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
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pillar.eyebrow, style: theme.textTheme.displayMedium),
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
                    padding: const EdgeInsets.only(right: 110),
                    child: Text(
                      pillar.blurb,
                      maxLines: 5,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: t.mutedForeground,
                      ),
                    ),
                  ),
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
                      Icon(Icons.arrow_forward, size: 18, color: t.foreground),
                    ],
                  ),
                ],
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
