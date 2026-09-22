import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../contracts/enums.dart';
import '../../../contracts/listing_image.dart';
import '../../../contracts/models/listing.dart';
import '../../../core/network/api_client.dart';

/// Mirror of `BlogPost` in `packages/shared`.
class BlogPost {
  const BlogPost({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    required this.bodyMarkdown,
    this.coverImageUrl,
    this.publishedAt,
    required this.authorName,
    this.category,
  });

  final String id;
  final String title;
  final String slug;
  final String? excerpt;
  final String bodyMarkdown;

  /// Resolved through the same allowlist as listing photos: covers are
  /// uploaded to the same Supabase bucket.
  final String? coverImageUrl;
  final DateTime? publishedAt;
  final String authorName;

  /// Nullable: posts written before the taxonomy existed have none, and the
  /// API deliberately does not guess one for them.
  final BlogCategory? category;

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    final cover = json['coverImageUrl'] as String?;
    return BlogPost(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String,
      excerpt: json['excerpt'] as String?,
      bodyMarkdown: json['bodyMarkdown'] as String? ?? '',
      coverImageUrl: cover == null ? null : resolveListingImage(cover),
      publishedAt: json['publishedAt'] is String
          ? DateTime.tryParse(json['publishedAt'] as String)?.toLocal()
          : null,
      authorName: json['authorName'] as String? ?? '',
      category: BlogCategory.tryParse(json['category'] as String?),
    );
  }
}

class JournalRepository {
  JournalRepository(this._api);

  final ApiClient _api;

  Future<Paginated<BlogPost>> list({
    BlogCategory? category,
    int page = 1,
  }) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/blog',
      query: {
        'page': page,
        'pageSize': 20,
        // The API filters on the enum value, not the URL slug.
        'category': ?category?.wire,
      },
      authed: false,
    );
    return Paginated.fromJson(json, BlogPost.fromJson);
  }

  /// Also resolves retired slugs: the API falls back to `BlogPostSlug`
  /// history, so an old shared link still opens the post.
  Future<BlogPost> bySlug(String slug) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/blog/$slug',
      authed: false,
    );
    return BlogPost.fromJson(json);
  }
}

final journalRepositoryProvider = Provider<JournalRepository>((ref) {
  return JournalRepository(ref.watch(apiClientProvider));
});
