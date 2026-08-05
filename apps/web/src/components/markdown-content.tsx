import { marked, type Token, type Tokens } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

// No Tailwind Typography plugin in this project — style the rendered markdown
// directly via child selectors instead of `prose`.
const PROSE_STYLES =
  "leading-relaxed text-foreground " +
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-semibold " +
  "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold " +
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold " +
  "[&_h5]:mt-4 [&_h5]:mb-1.5 [&_h5]:text-sm [&_h5]:font-semibold " +
  "[&_h6]:mt-4 [&_h6]:mb-1.5 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-muted-foreground " +
  "[&_p]:my-3 [&_p]:leading-relaxed " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_strong]:font-semibold " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm " +
  "[&_img]:my-4 [&_img]:rounded-xl";

/** Compares heading text to a title ignoring case, punctuation and spacing. */
function sameText(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return norm(a) === norm(b) && norm(a).length > 0;
}

/** Plain text of a heading token, ignoring its inline markup. */
function headingText(token: Tokens.Heading): string {
  return (token.tokens ?? []).map((t) => ("raw" in t ? t.raw : "")).join("");
}

/** marked's Token union includes an open-ended Generic, so `type` alone doesn't narrow. */
function isHeading(token: Token): token is Tokens.Heading {
  return token.type === "heading" && "depth" in token;
}

/**
 * Pushes every heading down `offset` levels, in place. Walked by hand rather
 * than via marked's `walkTokens` option because that hook only runs for
 * `marked.parse()` — this renders from a pre-lexed token list so it can drop a
 * duplicated title first.
 */
function demoteHeadings(tokens: Token[], offset: number): void {
  for (const token of tokens) {
    if (isHeading(token)) {
      token.depth = Math.min(6, token.depth + offset);
    }
    const nested = token as { tokens?: Token[]; items?: Token[] };
    if (nested.tokens) demoteHeadings(nested.tokens, offset);
    if (nested.items) demoteHeadings(nested.items, offset);
  }
}

/**
 * Renders admin-authored blog markdown as sanitized HTML. No "use client" —
 * isomorphic-dompurify works in both server and browser rendering, so this
 * can be dropped straight into a Server Component (the public blog pages)
 * without forcing a client-only render boundary around the post body.
 */
export function MarkdownContent({
  markdown,
  className,
  headingOffset = 0,
  dropTitle,
}: {
  markdown: string;
  className?: string;
  /**
   * Pushes every body heading down by this many levels. The post page already
   * renders the title as the page's one `<h1>`, so a body written with `#`
   * headings would otherwise emit a second (and third, and fourth) `<h1>` —
   * leaving the page with no heading hierarchy for search engines or screen
   * readers. Passing 1 makes `#` render as `<h2>`, which is what a body
   * heading actually is.
   */
  headingOffset?: number;
  /**
   * Post title. When the body opens with a heading repeating it — the common
   * habit when drafting elsewhere and pasting in — that heading is dropped so
   * readers don't see the title printed twice.
   */
  dropTitle?: string;
}) {
  const tokens = marked.lexer(markdown);

  if (dropTitle) {
    const first = tokens.find((t) => t.type !== "space");
    if (first && isHeading(first) && sameText(headingText(first), dropTitle)) {
      tokens.splice(tokens.indexOf(first), 1);
    }
  }

  if (headingOffset > 0) demoteHeadings(tokens, headingOffset);

  const raw = marked.parser(tokens, { async: false, gfm: true, breaks: true });
  const html = DOMPurify.sanitize(raw);
  return <div className={cn(PROSE_STYLES, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
