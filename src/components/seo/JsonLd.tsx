type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Injects JSON-LD for FAQ, breadcrumbs, etc. Safe in Server Components.
 */
export default function JsonLd({ data }: Props) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((obj, i) => (
        <script
          // eslint-disable-next-line react/no-danger -- JSON-LD requires inline script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
