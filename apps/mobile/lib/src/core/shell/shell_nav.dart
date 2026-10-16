import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// The tabs, in bar order.
enum AppTab { home, shop, sell, saved, account }

extension ShellNav on BuildContext {
  /// Switches tabs.
  ///
  /// Use this, not `push`, for any link that crosses tabs. Pushing
  /// `/listings` from the Home tab stacks a *second* browse screen inside the
  /// Home branch: the Shop tab stays on its own stale state, and Back walks
  /// through a duplicate. `goBranch` moves to the tab that owns the screen.
  void goTab(AppTab tab) =>
      StatefulNavigationShell.of(this).goBranch(tab.index);
}
