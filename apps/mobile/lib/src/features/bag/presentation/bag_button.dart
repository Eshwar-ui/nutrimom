import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../application/bag_controller.dart';

/// The bag, as an app-bar action with a count (PRD §11.2): a C2C bag usually
/// holds one item for a few minutes, so it does not earn a tab.
class BagButton extends ConsumerWidget {
  const BagButton({super.key, this.onDark = false});

  /// Over imagery, where the icon needs its own ground.
  final bool onDark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final count = ref.watch(bagProvider).length;
    return IconButton(
      onPressed: () => context.push('/bag'),
      tooltip: count == 0
          ? 'Bag'
          : 'Bag, $count ${count == 1 ? 'item' : 'items'}',
      style: onDark
          ? IconButton.styleFrom(
              backgroundColor: t.surface.withValues(alpha: 0.94),
              side: BorderSide(color: t.border),
            )
          : null,
      icon: Badge.count(
        count: count,
        isLabelVisible: count > 0,
        backgroundColor: t.accent,
        textColor: t.accentForeground,
        child: Icon(Icons.shopping_bag_outlined, color: t.foreground),
      ),
    );
  }
}
