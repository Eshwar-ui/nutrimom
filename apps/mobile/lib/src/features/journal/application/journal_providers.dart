import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/models/listing.dart';
import '../data/journal_repository.dart';

class JournalCategoryNotifier extends Notifier<BlogCategory?> {
  @override
  BlogCategory? build() => null;

  void select(BlogCategory? category) => state = category;
}

/// Null means "everything", matching the API: an absent category is all
/// posts, not uncategorised ones.
final journalCategoryProvider =
    NotifierProvider<JournalCategoryNotifier, BlogCategory?>(
      JournalCategoryNotifier.new,
    );

final journalPostsProvider = FutureProvider<Paginated<BlogPost>>((ref) {
  final category = ref.watch(journalCategoryProvider);
  return ref.watch(journalRepositoryProvider).list(category: category);
});

final journalPostProvider = FutureProvider.family<BlogPost, String>((
  ref,
  slug,
) {
  return ref.watch(journalRepositoryProvider).bySlug(slug);
});
