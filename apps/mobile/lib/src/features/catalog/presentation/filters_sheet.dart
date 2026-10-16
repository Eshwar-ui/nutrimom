import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/listing_query.dart';
import '../../../core/theme/app_tokens.dart';
import '../application/browse_controller.dart';
import '../application/catalog_providers.dart';

Future<void> showFiltersSheet(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    // Without a ceiling the sheet grows to the full screen on a long category
    // list and stops reading as a sheet — there is nothing behind it to tap
    // away from, and the drag handle ends up under the status bar.
    constraints: BoxConstraints(
      maxHeight: MediaQuery.sizeOf(context).height * 0.85,
    ),
    builder: (_) => const _FiltersSheet(),
  );
}

class _FiltersSheet extends ConsumerStatefulWidget {
  const _FiltersSheet();

  @override
  ConsumerState<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends ConsumerState<_FiltersSheet> {
  late ListingQuery _draft;
  late final TextEditingController _city;
  late final TextEditingController _minPrice;
  late final TextEditingController _maxPrice;

  @override
  void initState() {
    super.initState();
    // Edited as a draft and applied on confirm: changing five filters one at a
    // time would fire five round trips and shuffle the results under the
    // person still choosing.
    _draft = ref.read(browseQueryProvider);
    _city = TextEditingController(text: _draft.city ?? '');
    _minPrice = TextEditingController(text: _rupees(_draft.minPriceInPaise));
    _maxPrice = TextEditingController(text: _rupees(_draft.maxPriceInPaise));
  }

  static String _rupees(int? paise) =>
      paise == null ? '' : (paise ~/ 100).toString();

  /// Prices are entered in rupees because that is how a person thinks about
  /// them, and stored in paise because that is what the API speaks.
  static int? _toPaise(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;
    final rupees = int.tryParse(trimmed);
    return rupees == null ? null : rupees * 100;
  }

  @override
  void dispose() {
    _city.dispose();
    _minPrice.dispose();
    _maxPrice.dispose();
    super.dispose();
  }

  void _apply() {
    final min = _toPaise(_minPrice.text);
    final max = _toPaise(_maxPrice.text);
    // A reversed range returns nothing and reads as a broken app rather than a
    // mistyped filter, so it is swapped rather than submitted.
    final (lo, hi) = (min != null && max != null && min > max)
        ? (max, min)
        : (min, max);

    final city = _city.text.trim();
    ref
        .read(browseQueryProvider.notifier)
        .set(
          ListingQuery(
            category: _draft.category,
            condition: _draft.condition,
            city: city.isEmpty ? null : city,
            delivery: _draft.delivery,
            minPriceInPaise: lo,
            maxPriceInPaise: hi,
            search: _draft.search,
            sort: _draft.sort,
          ),
        );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categories = ref.watch(categoriesProvider).value ?? const [];

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Filters', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 18),
              _Label('Category'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final category in categories)
                    FilterChip(
                      label: Text(category.name),
                      selected: _draft.category == category.slug,
                      onSelected: (selected) => setState(() {
                        _draft = selected
                            ? _draft.copyWith(category: category.slug)
                            : _draft.copyWith(clearCategory: true);
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              _Label('Condition'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final condition in Condition.values)
                    FilterChip(
                      label: Text(condition.label),
                      selected: _draft.condition == condition,
                      onSelected: (selected) => setState(() {
                        _draft = selected
                            ? _draft.copyWith(condition: condition)
                            : _draft.copyWith(clearCondition: true);
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              _Label('Delivery'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final option in DeliveryOption.values)
                    FilterChip(
                      label: Text(option.label),
                      selected: _draft.delivery == option,
                      onSelected: (selected) => setState(() {
                        _draft = selected
                            ? _draft.copyWith(delivery: option)
                            : _draft.copyWith(clearDelivery: true);
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              _Label('Price (₹)'),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _minPrice,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(labelText: 'Min'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _maxPrice,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(labelText: 'Max'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _Label('City'),
              TextField(
                controller: _city,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'e.g. Bengaluru'),
              ),
              const SizedBox(height: 26),
              FilledButton(onPressed: _apply, child: const Text('Show items')),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  ref.read(browseQueryProvider.notifier).clearFilters();
                  Navigator.of(context).pop();
                },
                child: const Text('Clear all filters'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(
      text,
      style: Theme.of(context).textTheme.bodySmall?.copyWith(
        color: context.tokens.mutedForeground,
        fontWeight: FontWeight.w500,
      ),
    ),
  );
}
