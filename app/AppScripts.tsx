import Script from 'next/script';

export function AppScripts() {
  return (
    <>
      <Script
        src={process.env.NEXT_PUBLIC_UMAMI_URL_2 + '/plutonita.js'}
        data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID_2}
        data-host-url={process.env.NEXT_PUBLIC_UMAMI_URL_2}
        data-before-send="beforeSendHandler"
        data-performance="true"
        defer
      />
      <Script id="pathOverwriter">
        {`function beforeSendHandler(type, payload) {
            const url = payload.url;
            if(['es', 'pt'].includes(url.split("/")[3])) {
              payload.url = url.replace("/pt", "");
            }

            return payload;
        }`}
      </Script>
    </>
  );
}
