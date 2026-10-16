import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../catalog/presentation/widgets/listing_image.dart';
import '../application/journal_providers.dart';
import '../data/journal_repository.dart';

class JournalPostScreen extends ConsumerWidget {
  const JournalPostScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(journalPostProvider(slug));
    return Scaffold(
      appBar: AppBar(),
      body: AsyncView(
        value: post,
        onRetry: () => ref.invalidate(journalPostProvider(slug)),
        data: (p) => _Body(post: p),
      ),
    );
  }
}

/// Drops a leading heading that repeats the title.
///
/// The web hit this: the page renders the title as its heading, and then the
/// body's own `# Title` printed it a second time (`MarkdownContent`'s
/// `dropTitle`). Compared ignoring case and punctuation, as the web does.
String dropRepeatedTitle(String markdown, String title) {
  String norm(String s) =>
      s.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '');
  final lines = markdown.trimLeft().split('\n');
  if (lines.isEmpty) return markdown;
  final first = lines.first.trim();
  final match = RegExp(r'^#{1,6}\s+(.*)$').firstMatch(first);
  if (match != null && norm(match.group(1)!) == norm(title)) {
    return lines.skip(1).join('\n').trimLeft();
  }
  return markdown;
}

class _Body extends StatelessWidget {
  const _Body({required this.post});

  final BlogPost post;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final date = post.publishedAt;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
      children: [
        if (post.category != null)
          Text(
            post.category!.label.toUpperCase(),
            style: theme.textTheme.bodySmall?.copyWith(
              color: t.accentText,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.1,
            ),
          ),
        const SizedBox(height: 6),
        Text(post.title, style: theme.textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text(
          [
            if (post.authorName.trim().isNotEmpty) post.authorName,
            if (date != null)
              '${date.day} ${months[date.month - 1]} ${date.year}',
          ].join(' · '),
          style: theme.textTheme.bodySmall?.copyWith(color: t.mutedForeground),
        ),
        if (post.coverImageUrl != null) ...[
          const SizedBox(height: 18),
          ClipRRect(
            borderRadius: BorderRadius.circular(NmTokens.radius2xl),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: ListingImage(
                url: post.coverImageUrl,
                semanticLabel: post.title,
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        MarkdownBody(
          data: dropRepeatedTitle(post.bodyMarkdown, post.title),
          selectable: true,
          onTapLink: (_, href, _) {
            if (href == null) return;
            final uri = Uri.tryParse(href);
            if (uri != null) {
              launchUrl(uri, mode: LaunchMode.externalApplication);
            }
          },
          styleSheet: MarkdownStyleSheet.fromTheme(theme).copyWith(
            // The page title is the only top-level heading; body headings sit
            // a level below it, as the web's headingOffset does.
            h1: theme.textTheme.headlineSmall,
            h2: theme.textTheme.headlineSmall,
            h3: theme.textTheme.titleLarge,
            p: theme.textTheme.bodyLarge,
            listBullet: theme.textTheme.bodyLarge,
            a: theme.textTheme.bodyLarge?.copyWith(
              color: t.accentText,
              decoration: TextDecoration.underline,
            ),
            blockquoteDecoration: BoxDecoration(
              color: t.surface2,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }
}
