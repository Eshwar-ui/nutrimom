import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

// No Tailwind Typography plugin in this project — style the rendered markdown
// directly via child selectors instead of `prose`.
const PROSE_STYLES =
  "leading-relaxed text-foreground " +
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-semibold " +
  "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold " +
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_p]:my-3 [&_p]:leading-relaxed " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_strong]:font-semibold " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm " +
  "[&_img]:my-4 [&_img]:rounded-xl";

/**
 * Renders admin-authored blog markdown as sanitized HTML. No "use client" —
 * isomorphic-dompurify works in both server and browser rendering, so this
 * can be dropped straight into a Server Component (the public blog pages)
 * without forcing a client-only render boundary around the post body.
 */
export function MarkdownContent({ markdown, className }: { markdown: string; className?: string }) {
  const raw = marked.parse(markdown, { async: false, gfm: true, breaks: true });
  const html = DOMPurify.sanitize(raw);
  return <div className={cn(PROSE_STYLES, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
