import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/brand.dart';

/// Shown only while the keychain is read and the stored session probed.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('The Nurture Moms', style: theme.textTheme.displayMedium),
            const SizedBox(height: 10),
            Text(
              kBrandLine,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: context.tokens.mutedForeground,
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
          ],
        ),
      ),
    );
  }
}
