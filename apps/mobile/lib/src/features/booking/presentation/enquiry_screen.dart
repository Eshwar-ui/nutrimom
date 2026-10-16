import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/validators.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/brand.dart';
import '../../auth/application/auth_controller.dart';
import '../data/booking.dart';

/// The enquiry form: where a service CTA lands when there is no WhatsApp
/// number to send it to, and the app's general "Contact us".
///
/// Posts to the same `POST /contact` the web form uses, so enquiries from both
/// surfaces arrive in one admin inbox.
class EnquiryScreen extends ConsumerStatefulWidget {
  const EnquiryScreen({super.key, this.intent});

  /// Null for a general enquiry.
  final BookingIntent? intent;

  @override
  ConsumerState<EnquiryScreen> createState() => _EnquiryScreenState();
}

class _EnquiryScreenState extends ConsumerState<EnquiryScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  late final TextEditingController _message;
  bool _busy = false;
  bool _sent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Prefilled from the account when there is one. Nobody should retype their
    // own name and email into an app they are already signed in to.
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _email = TextEditingController(text: user?.email ?? '');
    _phone = TextEditingController(text: user?.whatsappNumber ?? '');
    _message = TextEditingController(text: widget.intent?.message ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  String get _subject {
    final intent = widget.intent;
    // The keyword rides along in the subject so admin sees the same YOGA /
    // FOOD / SOLIDS / CONNECTION attribution a WhatsApp enquiry would carry.
    // A real column for this is backend item B3.
    return intent == null
        ? 'General enquiry'
        : '${intent.service} enquiry (${intent.keyword})';
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(enquiryRepositoryProvider)
          .send(
            name: _name.text.trim(),
            email: _email.text.trim(),
            phone: _phone.text.trim(),
            subject: _subject,
            message: _message.text.trim(),
          );
      if (mounted) setState(() => _sent = true);
    } on ApiException catch (e) {
      if (mounted) {
        // 429 is the rate limiter on /contact; say so plainly rather than
        // showing the raw throttler text.
        setState(
          () => _error = e.statusCode == 429
              ? "You've sent a few of these in a row. Please wait a minute and try again."
              : e.message,
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final intent = widget.intent;
    return Scaffold(
      appBar: AppBar(
        title: Text(intent == null ? 'Contact us' : 'Book ${intent.service}'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: _sent ? _Sent(intent: intent) : _form(context),
        ),
      ),
    );
  }

  Widget _form(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.intent == null
                ? 'How can we help?'
                : "Tell us a little and we'll get back to you",
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'We reply by email or WhatsApp, usually within a day.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: t.mutedForeground,
            ),
          ),
          const SizedBox(height: 22),
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Your name'),
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            validator: (v) =>
                (v ?? '').trim().length < 2 ? 'Enter your name' : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            autofillHints: const [AutofillHints.email],
            validator: validateEmail,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _phone,
            decoration: const InputDecoration(
              labelText: 'WhatsApp number (optional)',
              helperText: 'Add it if you would rather we message you',
            ),
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumber],
            validator: validateWhatsappNumber,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _message,
            decoration: const InputDecoration(
              labelText: 'Message',
              alignLabelWithHint: true,
            ),
            maxLines: 5,
            maxLength: 4000,
            // Mirrors contactMessageInputSchema's minimum and its wording.
            validator: (v) => (v ?? '').trim().length < 10
                ? 'A little more detail helps us help you'
                : null,
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            FormErrorBanner(message: _error!),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _send,
            child: _busy
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: t.primaryForeground,
                    ),
                  )
                : const Text('Send'),
          ),
        ],
      ),
    );
  }
}

class _Sent extends StatelessWidget {
  const _Sent({this.intent});

  final BookingIntent? intent;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 24),
        Icon(Icons.mark_email_read_outlined, size: 44, color: t.primary),
        const SizedBox(height: 16),
        Text("Thank you, we've got it", style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          intent == null
              ? "We'll reply by email or WhatsApp, usually within a day."
              : "We'll be in touch about ${intent!.service.toLowerCase()} by email or WhatsApp, usually within a day.",
          style: theme.textTheme.bodyMedium?.copyWith(color: t.mutedForeground),
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Done'),
        ),
      ],
    );
  }
}
