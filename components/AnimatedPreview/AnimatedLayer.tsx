/* eslint-disable @next/next/no-head-element */

/* eslint-disable @next/next/no-img-element */

type AnimatedLayerProps = {
  jsAnimationUrl: string;
  fallbackImageUrl?: string;
};

export const AnimatedLayer = (props: AnimatedLayerProps) => {
  const { jsAnimationUrl } = props;

  return (
    <>
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <script src="/js/easeljs.min.js" defer></script>
          <script src="/js/tweenjs.min.js" defer></script>
          <script src={jsAnimationUrl} id="canvas-movie-library" defer />
          <script src="/js/animated-preview.js" defer></script>
          <style>
            {`html, body {
              background: transparent !important;
              color-scheme: light dark;
              margin: 0;
            }
            #asset-canvas,
              #asset-image,
              #fallback {
                position: absolute;
                left: 0;
                top: 0;
                width: min(100vw, 100vh);
                height: min(100vw, 100vh);
              }`}
          </style>
        </head>
        <body>
          <canvas id="asset-canvas">
            <img id="fallback" alt="image fallback" loading="lazy" src={props.fallbackImageUrl} />
          </canvas>
        </body>
      </html>
    </>
  );
};
