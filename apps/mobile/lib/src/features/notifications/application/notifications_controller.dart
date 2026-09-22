import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../auth/application/auth_controller.dart';

/// Unread notifications, for the Account tab badge.
///
/// Polled on demand rather than on a timer: until push lands (backend item
/// B1) there is nothing to react to, and a background poll on a metered
/// connection buys a number almost nobody is waiting for.
final unreadNotificationCountProvider = FutureProvider<int>((ref) async {
  final signedIn = ref.watch(
    authControllerProvider.select((s) => s.isSignedIn),
  );
  if (!signedIn) return 0;
  try {
    final rows = await ref
        .watch(apiClientProvider)
        .get<List<dynamic>>('/notifications');
    return rows
        .whereType<Map<String, dynamic>>()
        .where((n) => n['read'] != true)
        .length;
  } on ApiException {
    // A badge is not worth surfacing an error for.
    return 0;
  }
});
