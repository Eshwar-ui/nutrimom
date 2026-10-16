import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/booking.dart';

/// The one thing every service CTA does.
///
/// WhatsApp when the business has a number on its profile; the enquiry form
/// when it does not, or when WhatsApp cannot be opened on this device. Both
/// arrive attributed to the same keyword, so the choice of channel never
/// costs the business its attribution.
Future<void> startBooking(
  BuildContext context,
  WidgetRef ref,
  BookingIntent intent,
) async {
  final profile = await ref.read(businessProfileProvider.future);
  final url = bookingWhatsappUrl(profile, intent);

  if (url != null) {
    final opened = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
    if (opened) return;
  }
  if (context.mounted) context.push('/enquiry?intent=${intent.name}');
}

/// The primary action on a service page.
class BookButton extends ConsumerWidget {
  const BookButton({super.key, required this.intent, required this.label});

  final BookingIntent intent;
  final String label;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(businessProfileProvider).value;
    final viaWhatsapp = bookingWhatsappUrl(profile, intent) != null;
    return FilledButton.icon(
      onPressed: () => startBooking(context, ref, intent),
      // The icon says where the tap goes. A WhatsApp glyph on a button that
      // opens a form would be a small lie told at the moment of commitment.
      icon: Icon(
        viaWhatsapp ? Icons.chat_outlined : Icons.edit_note_outlined,
        size: 20,
      ),
      label: Text(label),
    );
  }
}
