import 'package:flutter/material.dart';

import '../../features/pillars/pillar_content.dart';
import '../theme/app_tokens.dart';

// The brand line lives with the pillar content; re-exported so there is one
// definition and existing imports of this file keep working.
export '../../features/pillars/pillar_content.dart'
    show kBrandLine, kBrandPromise, kTrustLine;

class BrandWordmark extends StatelessWidget {
  const BrandWordmark({super.key, this.showPromise = true});

  final bool showPromise;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('The Nurture Moms', style: theme.textTheme.headlineMedium),
        if (showPromise) ...[
          const SizedBox(height: 4),
          Text(
            kBrandPromise,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: context.tokens.mutedForeground,
            ),
          ),
        ],
      ],
    );
  }
}

/// A form error shown above the submit button.
///
/// Errors live next to the action that failed rather than in a snackbar that
/// can be missed — a failed sign-in with a vanished explanation is how someone
/// ends up trying the same password four times.
class FormErrorBanner extends StatelessWidget {
  const FormErrorBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.tokens.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: context.tokens.danger.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 20, color: context.tokens.danger),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(color: context.tokens.danger),
            ),
          ),
        ],
      ),
    );
  }
}

/// A short notice, used for the "you were signed out" explanation.
class NoticeBanner extends StatelessWidget {
  const NoticeBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.tokens.muted,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.tokens.border),
      ),
      child: Text(message, style: Theme.of(context).textTheme.bodyMedium),
    );
  }
}
