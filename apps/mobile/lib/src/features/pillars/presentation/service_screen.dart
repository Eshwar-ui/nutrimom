import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../booking/data/booking.dart';
import '../../booking/presentation/book_action.dart';
import '../pillar_content.dart';
import 'widgets/service_sections.dart';

/// Yoga, Nutrition, Starting Solids and Community: one screen, four contents.
///
/// Sections render in the order the web pages use, and only when the page has
/// content for them, so each screen keeps the shape of its web counterpart
/// without four near-identical widget trees drifting apart.
class ServiceScreen extends StatelessWidget {
  const ServiceScreen({super.key, required this.page});

  final ServicePage page;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final hasHeroArt = page.heroImage != null;

    return Scaffold(
      // Over the art the app bar is transparent, so the picture reaches the
      // top edge as it does on the web; without art it is an ordinary bar.
      extendBodyBehindAppBar: hasHeroArt,
      appBar: AppBar(
        backgroundColor: hasHeroArt ? Colors.transparent : t.background,
        forceMaterialTransparency: hasHeroArt,
        // Over art the bar is transparent, so once the page scrolls the back
        // arrow sat bare on top of the price notes. It carries its own ground.
        leading: hasHeroArt
            ? Padding(
                padding: const EdgeInsets.all(6),
                child: IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                  style: IconButton.styleFrom(
                    backgroundColor: t.surface.withValues(alpha: 0.94),
                    side: BorderSide(color: t.border),
                  ),
                  icon: Icon(Icons.adaptive.arrow_back, color: t.foreground),
                ),
              )
            : null,
      ),
      body: ListView(
        padding: EdgeInsets.only(
          top: hasHeroArt
              ? MediaQuery.paddingOf(context).top + kToolbarHeight
              : 0,
          bottom: 36,
        ),
        children: [
          ServiceHero(page: page),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                BookButton(intent: page.intent, label: page.primaryCta),
                if (page.credentials.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  CredentialStrip(items: page.credentials),
                ],
                if (page.offerings.isNotEmpty) ...[
                  const SizedBox(height: 34),
                  SectionHeading(page.offeringsHeading ?? 'What we offer'),
                  OfferingList(items: page.offerings),
                ],
                if (page.includes.isNotEmpty) ...[
                  const SizedBox(height: 34),
                  SectionHeading(page.includesHeading ?? 'What it includes'),
                  IncludesList(items: page.includes),
                ],
                if (page.intent == BookingIntent.community) ...[
                  const SizedBox(height: 34),
                  const _CommunityMembership(),
                ],
                if (page.pricing.isNotEmpty) ...[
                  const SizedBox(height: 34),
                  SectionHeading(page.pricingHeading),
                  const SizedBox(height: 6),
                  PaperPriceNotes(rows: page.pricing, note: page.pricingNote),
                ],
                if (page.safety != null) ...[
                  const SizedBox(height: 28),
                  SafetyNote(text: page.safety!),
                ],
                const SizedBox(height: 34),
                ClosingCard(page: page),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Brief §7: the community is free. The paid tier is described as coming, not
/// sold, because the brief says not to launch it until its benefits and
/// schedule are defined.
class _CommunityMembership extends StatelessWidget {
  const _CommunityMembership();

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
        border: Border.all(color: t.border, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(kCommunityFreeTitle, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(kCommunityFreeBody, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 12),
          Text(
            kCommunityPlusBody,
            style: theme.textTheme.bodySmall?.copyWith(
              color: t.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}
