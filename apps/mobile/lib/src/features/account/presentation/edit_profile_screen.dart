import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/validators.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/brand.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/data/auth_repository.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _whatsapp;
  late final TextEditingController _city;
  late final TextEditingController _bio;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Safe to read synchronously: this screen is only reachable from the
    // account screen, which the router keeps behind a resolved session.
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _whatsapp = TextEditingController(text: user?.whatsappNumber ?? '');
    _city = TextEditingController(text: user?.city ?? '');
    _bio = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _whatsapp.dispose();
    _city.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .updateProfile(
            name: _name.text.trim(),
            whatsappNumber: _whatsapp.text.trim(),
            city: _city.text.trim(),
            bio: _bio.text.trim(),
          );
      await ref.read(authControllerProvider.notifier).refreshUser();
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Profile updated')));
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Full name'),
                  textCapitalization: TextCapitalization.words,
                  validator: validateName,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _whatsapp,
                  decoration: const InputDecoration(
                    labelText: 'WhatsApp number',
                    helperText: 'Buyers use this to ask about your listings',
                  ),
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  validator: validateWhatsappNumber,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _city,
                  decoration: const InputDecoration(labelText: 'City'),
                  textCapitalization: TextCapitalization.words,
                  validator: validateCity,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _bio,
                  decoration: const InputDecoration(
                    labelText: 'About you',
                    alignLabelWithHint: true,
                  ),
                  maxLines: 4,
                  maxLength: 400,
                  validator: validateBio,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  FormErrorBanner(message: _error!),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _save,
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Save changes'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
