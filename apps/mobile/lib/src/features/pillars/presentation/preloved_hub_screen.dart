import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/shell/shell_nav.dart';
import '../../../core/theme/app_tokens.dart';

/// The Pass-it-on pillar's hub (brief §8): keep the marketplace, reposition it
/// as one pillar, and give it the buy / sell / donate framing.
///
/// Shop and Sell switch tabs rather than pushing a copy of those screens into
/// this one, because each already owns a tab.
class PrelovedHubScreen extends StatelessWidget {
  const PrelovedHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 36),
        children: [
          Text(
            'Pass it on',
            style: theme.textTheme.labelLarge?.copyWith(color: t.accentText),
          ),
          const SizedBox(height: 6),
          Text(
            'Loved before. Loved again.',
            style: theme.textTheme.headlineLarge,
          ),
          const SizedBox(height: 10),
          Text(
            'Give useful baby and maternity essentials another loving chapter, and find what '
            'your family needs next without paying retail for it.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 22),
          ClipRRect(
            borderRadius: BorderRadius.circular(NmTokens.radius2xl),
            child: AspectRatio(
              aspectRatio: 4 / 3,
              child: ColoredBox(
                color: Color.alphaBlend(
                  t.lavender.withValues(alpha: 0.4),
                  t.surface,
                ),
                child: Image.asset(
                  'assets/images/pillar-pass-it-on.png',
                  fit: BoxFit.contain,
                  excludeFromSemantics: true,
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text('Three ways to take part', style: theme.textTheme.headlineSmall),
          const SizedBox(height: 14),
          _Way(
            icon: Icons.shopping_bag_outlined,
            wash: t.blush,
            title: 'Shop preloved',
            body:
                'Browse gently used strollers, carriers, clothes, toys and maternity wear from '
                'local families at a fraction of retail.',
            onTap: () => context.goTab(AppTab.shop),
          ),
          _Way(
            icon: Icons.sell_outlined,
            wash: t.sage,
            title: "Sell what you've outgrown",
            body:
                'Photograph it, set your price, and give your baby gear a second home. We handle '
                'payments and the shipping label.',
            onTap: () => context.goTab(AppTab.sell),
          ),
          _Way(
            icon: Icons.volunteer_activism_outlined,
            wash: t.sky,
            title: 'Or pass it on',
            body:
                "Donate what you no longer need to another mom who'll treasure it just as much "
                'as you did.',
            // The web sends donations to the contact form too: there is no
            // donation flow yet, and a person is how one gets arranged.
            onTap: () => context.push('/enquiry'),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: t.surface2,
              borderRadius: BorderRadius.circular(NmTokens.radius2xl),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Checked before it goes live',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  'Every listing is reviewed before it appears, sellers are verified, and payment '
                  'happens online through a secure gateway.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: t.mutedForeground,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "Motherhood doesn't have to cost a fortune",
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  'Practical, responsible reuse, and real value, without treating secondhand as second best.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: t.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => context.goTab(AppTab.shop),
            child: const Text('Shop preloved'),
          ),
        ],
      ),
    );
  }
}

class _Way extends StatelessWidget {
  const _Way({
    required this.icon,
    required this.wash,
    required this.title,
    required this.body,
    required this.onTap,
  });

  final IconData icon;
  final Color wash;
  final String title;
  final String body;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(NmTokens.radius2xl),
            border: Border.all(color: t.border, width: 2),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Color.alphaBlend(
                    wash.withValues(alpha: 0.6),
                    t.surface,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 21, color: t.foreground),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: t.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.arrow_forward, size: 20, color: t.accentText),
            ],
          ),
        ),
      ),
    );
  }
}
