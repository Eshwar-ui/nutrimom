import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_tokens.dart';

/// About (brief §9).
///
/// Both founders are named as Co-founder and nothing more. The brief is
/// explicit on Nandini ("do not invent her title, qualifications, professional
/// history or responsibilities beyond Co-founder") and asks that Sudha's
/// credentials appear only once confirmed, which they have not been (PRD Q1).
/// When they are, they go here; until then this screen invents nothing.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 40),
        children: [
          Text(
            'Meet the women behind The Nurture Moms',
            style: theme.textTheme.headlineLarge,
          ),
          const SizedBox(height: 10),
          Text(
            'A mom-led platform created to support mothers through the many stages of motherhood.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 26),
          const _Founder(name: 'Sudha'),
          const SizedBox(height: 12),
          const _Founder(name: 'Nandini'),
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Color.alphaBlend(
                t.sage.withValues(alpha: 0.35),
                t.surface,
              ),
              borderRadius: BorderRadius.circular(NmTokens.radius3xl),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Our mission', style: theme.textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(
                  'To create a trusted, practical and welcoming ecosystem where moms can find '
                  'support, learn from experts, connect with other mothers and make thoughtful '
                  'choices for their families.',
                  style: theme.textTheme.bodyLarge,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          OutlinedButton(
            onPressed: () => context.push('/enquiry'),
            child: const Text('Get in touch'),
          ),
        ],
      ),
    );
  }
}

class _Founder extends StatelessWidget {
  const _Founder({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(NmTokens.radius2xl),
        border: Border.all(color: t.border, width: 2),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: Color.alphaBlend(
              t.blush.withValues(alpha: 0.6),
              t.surface,
            ),
            child: Text(
              name.characters.first,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: t.foreground,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: theme.textTheme.titleLarge),
              Text(
                'Co-founder',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: t.mutedForeground,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
