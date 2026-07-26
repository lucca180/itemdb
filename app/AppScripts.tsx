import Script from 'next/script';

export function AppScripts() {
  return (
    <>
      {/* Must exist before Umami runs (lazyOnload). */}
      <Script id="pathOverwriter" strategy="afterInteractive">
        {`function beforeSendHandler(type, payload) {
            const url = payload.url;
            if(['es', 'pt'].includes(url.split("/")[3])) {
              payload.url = url.replace("/pt", "");
            }

            return payload;
        }`}
      </Script>
      <Script
        src={process.env.NEXT_PUBLIC_UMAMI_URL_2 + '/plutonita.js'}
        data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID_2}
        data-host-url={process.env.NEXT_PUBLIC_UMAMI_URL_2}
        data-before-send="beforeSendHandler"
        strategy="lazyOnload"
      />
    </>
  );
}
