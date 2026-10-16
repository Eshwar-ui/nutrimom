import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../contracts/money.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../auth/application/auth_controller.dart';
import '../data/seller_billing_repository.dart';

/// The Sell tab.
///
/// Not a screen so much as four, one per gate. `assertCanList` requires paid
/// registration **and** admin approval **and** an active membership, and a
/// seller blocked on one of them needs to know which — the web learned this
/// the hard way, where a bare "your seller account must be verified" was shown
/// to people who had in fact paid.
class SellScreen extends ConsumerWidget {
  const SellScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(
      authControllerProvider.select((s) => s.isSignedIn),
    );
    final status = ref.watch(sellerBillingStatusProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sell')),
      body: !signedIn
          ? const _SignInFirst()
          : RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(sellerBillingStatusProvider);
                await ref.read(sellerBillingStatusProvider.future);
              },
              child: AsyncView(
                value: status,
                onRetry: () => ref.invalidate(sellerBillingStatusProvider),
                data: (s) => s == null
                    ? const _SignInFirst()
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                        children: [_ForGate(status: s)],
                      ),
              ),
            ),
    );
  }
}

class _ForGate extends StatelessWidget {
  const _ForGate({required this.status});

  final SellerBillingStatus status;

  @override
  Widget build(BuildContext context) {
    return switch (status.gate) {
      SellerGate.notRegistered => _NotRegistered(
        feePaise: status.registrationFeePaise,
      ),
      SellerGate.awaitingApproval => const _AwaitingApproval(),
      SellerGate.needsMembership => _NeedsMembership(status: status),
      SellerGate.canList => const _CanList(),
    };
  }
}

/// Registration and membership are bought on the web, not in the app.
///
/// Both unlock the ability to list, which reads as a digital service to the
/// app stores; charging for it through Razorpay in-app risks rejection. PRD
/// decision D4. Buying and selling the goods themselves stays in-app.
Future<void> _openBilling(BuildContext context) async {
  final url = Uri.parse('${AppConfig.webBaseUrl}/account/membership');
  if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("We couldn't open the browser on this device."),
        ),
      );
    }
  }
}

class _SignInFirst extends StatelessWidget {
  const _SignInFirst();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        EmptyView(
          title: 'Sign in to start selling',
          body: 'List what your little ones have outgrown and give it a second home.',
          icon: Icons.sell_outlined,
          action: FilledButton(
            onPressed: () =>
                context.push('/login?next=${Uri.encodeComponent('/sell')}'),
            child: const Text('Sign in'),
          ),
        ),
      ],
    );
  }
}

class _NotRegistered extends StatelessWidget {
  const _NotRegistered({required this.feePaise});

  final int feePaise;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Sell on The Nurture Moms', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 10),
        Text(
          'A one-time ${formatPaise(feePaise)} registration activates your seller account. '
          'An admin reviews it, and after that you choose a listing plan.',
          style: theme.textTheme.bodyLarge?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 22),
        const _Step(
          n: 1,
          title: 'Register',
          body: 'One-time fee, verified once.',
        ),
        const _Step(
          n: 2,
          title: 'Get approved',
          body: 'An admin checks the account.',
        ),
        const _Step(
          n: 3,
          title: 'Pick a plan',
          body: 'Monthly through yearly.',
        ),
        const _Step(
          n: 4,
          title: 'List from your camera',
          body: 'Photograph it and publish.',
        ),
        const SizedBox(height: 22),
        FilledButton(
          onPressed: () => _openBilling(context),
          child: const Text('Register as a seller'),
        ),
        const SizedBox(height: 10),
        Text(
          'Registration and plans are handled on the website. You will come back here to list.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall?.copyWith(color: t.mutedForeground),
        ),
      ],
    );
  }
}

class _AwaitingApproval extends StatelessWidget {
  const _AwaitingApproval();

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        Icon(Icons.hourglass_top_outlined, size: 40, color: t.mutedForeground),
        const SizedBox(height: 16),
        Text('Your registration is in', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          'An admin is reviewing your seller account. You will get a notification '
          'as soon as it is approved, and then you can choose a plan.',
          style: theme.textTheme.bodyMedium?.copyWith(color: t.mutedForeground),
        ),
      ],
    );
  }
}

class _NeedsMembership extends StatelessWidget {
  const _NeedsMembership({required this.status});

  final SellerBillingStatus status;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final expired = status.lastMembershipExpiredAt;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          expired == null ? 'Choose a listing plan' : 'Your plan has ended',
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: 10),
        Text(
          expired == null
              ? 'Your account is approved. A plan keeps your listings live.'
              : 'It ended on ${_date(expired)}. Renew to put your listings back up.',
          style: theme.textTheme.bodyLarge?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 22),
        FilledButton(
          onPressed: () => _openBilling(context),
          child: Text(expired == null ? 'See plans' : 'Renew plan'),
        ),
        const SizedBox(height: 10),
        Text(
          'Plans are purchased on the website.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall?.copyWith(color: t.mutedForeground),
        ),
      ],
    );
  }

  static String _date(DateTime d) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _CanList extends StatelessWidget {
  const _CanList();

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text("You're set to list", style: theme.textTheme.headlineMedium),
        const SizedBox(height: 10),
        Text(
          'Your plan is active. The camera composer lands in the next build; '
          'until then you can list on the website.',
          style: theme.textTheme.bodyLarge?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 22),
        OutlinedButton(
          onPressed: () => _openBilling(context),
          child: const Text('Manage plan'),
        ),
      ],
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.n, required this.title, required this.body});

  final int n;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Color.alphaBlend(t.sage.withValues(alpha: 0.5), t.surface),
              shape: BoxShape.circle,
            ),
            child: Text(
              '$n',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleMedium),
                Text(
                  body,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: t.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
