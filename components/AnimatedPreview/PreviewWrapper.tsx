type PreviewWrapperProps = {
  children?: React.ReactNode;
};

export const PreviewWrapper = (props: PreviewWrapperProps) => {
  return (
    <>
      <style>
        {`
        html, body {
          background: transparent !important;
          color-scheme: light dark;
          margin: 0;
        }
        .itemPreview {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .itemPreview img, .itemPreview iframe {
          position: absolute;
          left: 0;
          top: 0;
          inset: 0;
          pointer-events: none;
          border: none;
          width: 100%;
          height: 100%;
        }
      `}
      </style>
      <div className="itemPreview">{props.children}</div>
    </>
  );
};
