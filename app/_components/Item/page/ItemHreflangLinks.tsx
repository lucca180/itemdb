import { buildItemDbHreflangAlternates } from '@app/utils/appPage';

/** HTML hreflang — avoids bloating HTTP `Link` headers via Metadata `alternates.languages`. */
export function ItemHreflangLinks({ slug }: { slug: string }) {
  const { languages } = buildItemDbHreflangAlternates(`/item/${slug}`);

  return (
    <>
      <link rel="alternate" hrefLang="en" href={languages.en} />
      <link rel="alternate" hrefLang="pt" href={languages.pt} />
      <link rel="alternate" hrefLang="x-default" href={languages['x-default']} />
    </>
  );
}
