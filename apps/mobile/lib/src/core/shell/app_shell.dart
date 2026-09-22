import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/notifications/application/notifications_controller.dart';
import '../theme/app_tokens.dart';

/// The bottom tab bar.
///
/// Five destinations, and Sell gets one of them because listing friction is
/// what the app exists to remove (PRD goal 2). The bar never changes length:
/// the Sell tab stays put for someone who has not registered and shows them
/// how to start, because a bar that switches between four and five items as
/// account status changes reads as a bug rather than as personalisation.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final unread = ref.watch(unreadNotificationCountProvider).value ?? 0;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: t.surface,
          border: Border(top: BorderSide(color: t.border, width: 1)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: _onTap,
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          indicatorColor: Color.alphaBlend(
            t.sage.withValues(alpha: 0.45),
            t.surface,
          ),
          // Labels always on: icon-only bars cost recognition for people who
          // are not fluent in app iconography, which is a real part of this
          // audience.
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            const NavigationDestination(
              icon: Icon(Icons.search_outlined),
              selectedIcon: Icon(Icons.search),
              label: 'Shop',
            ),
            const NavigationDestination(
              icon: Icon(Icons.photo_camera_outlined),
              selectedIcon: Icon(Icons.photo_camera),
              label: 'Sell',
            ),
            const NavigationDestination(
              icon: Icon(Icons.favorite_border),
              selectedIcon: Icon(Icons.favorite),
              label: 'Saved',
            ),
            NavigationDestination(
              icon: Badge.count(
                count: unread,
                isLabelVisible: unread > 0,
                child: const Icon(Icons.person_outline),
              ),
              selectedIcon: Badge.count(
                count: unread,
                isLabelVisible: unread > 0,
                child: const Icon(Icons.person),
              ),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }

  void _onTap(int index) {
    // Tapping the tab you are already on pops that branch back to its root —
    // the standard escape hatch out of a deep stack, and the reason each
    // branch owns its own navigator.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}
