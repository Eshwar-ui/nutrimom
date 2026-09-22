import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_tokens.dart';
import '../../auth/application/auth_controller.dart';
import 'edit_profile_screen.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final user = ref.watch(authControllerProvider.select((s) => s.user));

    // Signed out is a real state for this tab, not a redirect: About, the
    // Journal and the legal pages live here, and the brief's launch checklist
    // (§17) needs privacy, terms, refunds and contact reachable by anyone.
    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Account')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Join The Nurture Moms',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Save items, message sellers, buy and sell, all from one account.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: context.tokens.mutedForeground,
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Create an account'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton(
                      onPressed: () => context.push('/login'),
                      child: const Text('Sign in'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const _InfoLinks(),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Your account')),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(authControllerProvider.notifier).refreshUser(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
          children: [
            Text(user.name, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(
              user.email,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: context.tokens.mutedForeground,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (user.isAdmin)
                  const _Chip(label: 'Admin', tone: _Tone.neutral),
                // The three seller gates, shown as what they are rather than
                // collapsed into one "verified" badge — someone who has paid
                // but is waiting on an admin needs to see that distinction.
                _Chip(
                  label: user.hasRegistered
                      ? 'Registration paid'
                      : 'Not registered as a seller',
                  tone: user.hasRegistered ? _Tone.good : _Tone.neutral,
                ),
                if (user.hasRegistered)
                  _Chip(
                    label: user.isSellerVerified
                        ? 'Seller approved'
                        : 'Awaiting admin approval',
                    tone: user.isSellerVerified ? _Tone.good : _Tone.pending,
                  ),
              ],
            ),
            const SizedBox(height: 24),
            _Field(label: 'WhatsApp', value: user.whatsappNumber),
            _Field(label: 'City', value: user.city),
            _Field(label: 'About you', value: user.bio),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const EditProfileScreen(),
                ),
              ),
              child: const Text('Edit profile'),
            ),
            const SizedBox(height: 28),
            const _InfoLinks(),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () async {
                await ref.read(authControllerProvider.notifier).signOut();
                if (context.mounted) context.go('/');
              },
              child: const Text('Sign out'),
            ),
            TextButton(
              onPressed: () => _confirmSignOutEverywhere(context, ref),
              style: TextButton.styleFrom(
                foregroundColor: context.tokens.danger,
              ),
              child: const Text('Sign out on all devices'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmSignOutEverywhere(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out everywhere?'),
        content: const Text(
          'This signs you out of this app and any browser where you are signed in. '
          'You will need to sign in again on each one.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(authControllerProvider.notifier).signOutEverywhere();
    if (context.mounted) context.go('/');
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shown = (value ?? '').trim();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: context.tokens.mutedForeground,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            shown.isEmpty ? 'Not added yet' : shown,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: shown.isEmpty
                  ? context.tokens.mutedForeground
                  : context.tokens.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

enum _Tone { good, pending, neutral }

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.tone});

  final String label;
  final _Tone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      _Tone.good => (
        context.tokens.sage.withValues(alpha: 0.35),
        context.tokens.primary,
      ),
      _Tone.pending => (
        context.tokens.gold.withValues(alpha: 0.28),
        const Color(0xFF6B4E1F),
      ),
      _Tone.neutral => (context.tokens.muted, context.tokens.mutedForeground),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall
            ?.copyWith(color: fg, fontWeight: FontWeight.w500),
      ),
    );
  }
}

/// About, the Journal, help and the legal pages.
///
/// Legal pages open on the web rather than being copied in: they publish off
/// the admin-filled BusinessProfile and the live cancellation policy, and a
/// second copy in the app would be a second thing that can go stale.
class _InfoLinks extends StatelessWidget {
  const _InfoLinks();

  Future<void> _web(BuildContext context, String path) async {
    final ok = await launchUrl(
      Uri.parse('${AppConfig.webBaseUrl}$path'),
      mode: LaunchMode.inAppBrowserView,
    );
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("We couldn't open that page on this device."),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);

    Widget group(String title, List<Widget> rows) => Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(
              title,
              style: theme.textTheme.bodySmall?.copyWith(
                color: t.mutedForeground,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: BorderRadius.circular(NmTokens.radiusXl),
              border: Border.all(color: t.border, width: 2),
            ),
            child: Column(children: rows),
          ),
        ],
      ),
    );

    Widget row(
      IconData icon,
      String label,
      VoidCallback onTap, {
      bool web = false,
    }) => ListTile(
      leading: Icon(icon, color: t.foreground),
      title: Text(label, style: theme.textTheme.bodyLarge),
      trailing: Icon(
        web ? Icons.open_in_new : Icons.chevron_right,
        size: 18,
        color: t.mutedForeground,
      ),
      onTap: onTap,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        group('Explore', [
          row(
            Icons.favorite_outline,
            'About The Nurture Moms',
            () => context.push('/about'),
          ),
          row(
            Icons.menu_book_outlined,
            'The Nurture Journal',
            () => context.push('/journal'),
          ),
        ]),
        group('Help', [
          row(
            Icons.help_outline,
            'FAQs',
            () => _web(context, '/faq'),
            web: true,
          ),
          row(Icons.mail_outline, 'Contact us', () => context.push('/enquiry')),
        ]),
        group('Policies', [
          row(
            Icons.policy_outlined,
            'Policies',
            () => _web(context, '/policies'),
            web: true,
          ),
          row(
            Icons.description_outlined,
            'Terms',
            () => _web(context, '/terms'),
            web: true,
          ),
          row(
            Icons.privacy_tip_outlined,
            'Privacy',
            () => _web(context, '/privacy'),
            web: true,
          ),
          row(
            Icons.currency_rupee,
            'Refunds & cancellation',
            () => _web(context, '/refunds'),
            web: true,
          ),
        ]),
      ],
    );
  }
}
