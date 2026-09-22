import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../application/payment_outcome.dart';

/// How a payment outcome is shown, everywhere it is shown.
///
/// When money has moved ([PaymentOutcome.charged]), the card says so first,
/// in a calm tone, with the payment reference to quote. It never uses the
/// error colour for that case: red is how a buyer is told their money is gone.
class OutcomeCard extends StatelessWidget {
  const OutcomeCard({
    super.key,
    required this.outcome,
    this.onRetry,
    this.busy = false,
  });

  final PaymentOutcome outcome;
  final VoidCallback? onRetry;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final (bg, fg, icon) = switch (outcome.tone) {
      OutcomeTone.error => (
        t.danger.withValues(alpha: 0.08),
        t.danger,
        Icons.error_outline,
      ),
      OutcomeTone.warning => (
        t.gold.withValues(alpha: 0.18),
        t.foreground,
        Icons.schedule,
      ),
      OutcomeTone.neutral => (t.muted, t.foreground, Icons.info_outline),
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(NmTokens.radiusXl),
        border: Border.all(color: fg.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: fg),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  outcome.title,
                  style: theme.textTheme.titleMedium?.copyWith(color: fg),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(outcome.description, style: theme.textTheme.bodyMedium),
          if (outcome.reference != null && outcome.reference!.isNotEmpty) ...[
            const SizedBox(height: 6),
            SelectableText(
              'Payment reference: ${outcome.reference}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: t.mutedForeground,
              ),
            ),
          ],
          if (onRetry != null && outcome.retryLabel != null) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: busy ? null : onRetry,
              child: busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2.2),
                    )
                  : Text(outcome.retryLabel!),
            ),
          ],
        ],
      ),
    );
  }
}
