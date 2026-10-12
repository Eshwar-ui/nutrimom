import type { JsonLdNode } from "@/lib/structured-data";

/**
 * Renders schema.org structured data.
 *
 * The `<` escape is not optional: listing titles, seller names and blog
 * excerpts are user-supplied, and a `</script>` inside one would otherwise
 * close the tag and turn the rest of the payload into live markup.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
