import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/about/about_screen.dart';
import '../../features/account/presentation/account_screen.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/catalog/presentation/browse_screen.dart';
import '../../features/catalog/presentation/listing_detail_screen.dart';
import '../../features/catalog/presentation/seller_profile_screen.dart';
import '../../features/booking/data/booking.dart';
import '../../features/booking/presentation/enquiry_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/home/presentation/splash_screen.dart';
import '../../features/journal/presentation/journal_post_screen.dart';
import '../../features/journal/presentation/journal_screen.dart';
import '../../features/pillars/pillar_content.dart';
import '../../features/pillars/presentation/preloved_hub_screen.dart';
import '../../features/pillars/presentation/service_screen.dart';
import '../../features/sell/presentation/sell_screen.dart';
import '../../features/wishlist/presentation/wishlist_screen.dart';
import '../shell/app_shell.dart';

/// Routes that require a signed-in user.
///
/// Everything else is public on purpose: browsing the marketplace without an
/// account is both the better funnel and an App Store review expectation for a
/// catalog app (PRD R2.5). Every tab handles its own signed-out state, so a
/// tab never bounces you to a login screen. Nothing is gated here today; the
/// list stays so a future account-only route has one obvious place to go.
const _authedPrefixes = <String>[];

final _rootKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  // go_router wants a Listenable; Riverpod speaks providers. This is the
  // bridge — one notifier, poked whenever the auth status actually changes.
  final refresh = ValueNotifier<AuthStatus>(AuthStatus.unknown);
  ref.listen(
    authControllerProvider.select((s) => s.status),
    (_, next) => refresh.value = next,
    fireImmediately: true,
  );
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final location = state.matchedLocation;

      // Hold on the splash until the keychain has been read and the stored
      // session probed — flashing the login screen at someone who is signed in
      // is the most common bug in this kind of bootstrap.
      if (status == AuthStatus.unknown) {
        return location == '/splash' ? null : '/splash';
      }
      if (location == '/splash') return '/';

      final needsAuth = _authedPrefixes.any(location.startsWith);
      if (needsAuth && status != AuthStatus.signedIn) {
        return '/login?next=${Uri.encodeComponent(location)}';
      }

      final isAuthScreen =
          location == '/login' ||
          location == '/register' ||
          location == '/forgot-password';
      if (isAuthScreen && status == AuthStatus.signedIn) return '/';

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),

      // Auth sits OUTSIDE the shell, pushed over it: a sign-in screen with a
      // tab bar under it invites a tab switch mid-form.
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootKey,
        builder: (_, state) =>
            LoginScreen(next: state.uri.queryParameters['next']),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: _rootKey,
        builder: (_, state) =>
            RegisterScreen(next: state.uri.queryParameters['next']),
      ),
      GoRoute(
        path: '/forgot-password',
        parentNavigatorKey: _rootKey,
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      // Over the shell, like auth: a form with a tab bar under it invites a
      // tab switch halfway through typing.
      GoRoute(
        path: '/enquiry',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => EnquiryScreen(
          intent: BookingIntent.values
              .where((i) => i.name == state.uri.queryParameters['intent'])
              .firstOrNull,
        ),
      ),
      // About and the Journal are reachable from Home and from Account, so
      // they open over the shell rather than inside one branch: tapping
      // "About" in Account must not yank the reader across to the Home tab.
      GoRoute(
        path: '/about',
        parentNavigatorKey: _rootKey,
        builder: (_, _) => const AboutScreen(),
      ),
      GoRoute(
        path: '/journal',
        parentNavigatorKey: _rootKey,
        builder: (_, _) => const JournalScreen(),
        routes: [
          GoRoute(
            path: ':slug',
            parentNavigatorKey: _rootKey,
            builder: (_, state) =>
                JournalPostScreen(slug: state.pathParameters['slug']!),
          ),
        ],
      ),
      // The web renamed /blog to /journal with 308s. Old links shared from the
      // web still land here, so they redirect the same way.
      GoRoute(
        path: '/blog/:slug',
        redirect: (_, state) => '/journal/${state.pathParameters['slug']}',
      ),
      GoRoute(path: '/blog', redirect: (_, _) => '/journal'),

      // One navigator per tab, so a scroll position and a half-set filter
      // survive a trip to another tab and back.
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(navigationShell: shell),
        branches: [
          // Home owns the four pillars, so Back from a pillar returns Home.
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
              GoRoute(
                path: '/yoga',
                builder: (_, _) => const ServiceScreen(page: kYoga),
              ),
              GoRoute(
                path: '/nutrition',
                builder: (_, _) => const ServiceScreen(page: kNutrition),
                routes: [
                  GoRoute(
                    path: 'starting-solids',
                    builder: (_, _) =>
                        const ServiceScreen(page: kStartingSolids),
                  ),
                ],
              ),
              GoRoute(
                path: '/community',
                builder: (_, _) => const ServiceScreen(page: kCommunity),
              ),
              GoRoute(
                path: '/preloved',
                builder: (_, _) => const PrelovedHubScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/listings',
                builder: (_, _) => const BrowseScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (_, state) =>
                        ListingDetailScreen(id: state.pathParameters['id']!),
                  ),
                ],
              ),
              GoRoute(
                path: '/sellers/:id',
                builder: (_, state) =>
                    SellerProfileScreen(id: state.pathParameters['id']!),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/sell', builder: (_, _) => const SellScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/wishlist',
                builder: (_, _) => const WishlistScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/account',
                builder: (_, _) => const AccountScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      appBar: AppBar(title: const Text('Not found')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            "We couldn't find that page.\n\n${state.uri}",
            textAlign: TextAlign.center,
          ),
        ),
      ),
    ),
  );
});
