/**
 * Renders structured data. The payload is always built by `lib/seo.ts` from
 * our own static content, never from user input, so `JSON.stringify` output is
 * safe here — the `<` escape keeps a stray sequence from closing the tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
