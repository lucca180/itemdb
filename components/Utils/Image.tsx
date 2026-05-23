'use client';

import { Box, type BoxProps } from '@chakra-ui/react';
import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import { forwardRef } from 'react';

export type ImageProps = NextImageProps & BoxProps;

function parsePixelSize(value: BoxProps['width']): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const match = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (match) return Math.round(Number(match[1]));
  }
  return undefined;
}

/**
 * Next.js Image with Chakra layout/style props on a wrapper Box.
 * Do not use chakra(NextImage) — Chakra maps width/height to CSS and breaks next/image SSR.
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(props, ref) {
  const {
    src,
    alt,
    width,
    height,
    fill,
    sizes,
    quality,
    priority,
    placeholder,
    blurDataURL,
    loading,
    unoptimized,
    loader,
    fetchPriority,
    decoding,
    overrideSrc,
    onLoad,
    onError,
    onLoadingComplete,
    style,
    className,
    id,
    w,
    h,
    minW,
    minH,
    maxW,
    maxH,
    boxSize,
    ...boxProps
  } = props;

  let nextWidth = typeof width === 'number' ? width : parsePixelSize(width);
  let nextHeight = typeof height === 'number' ? height : parsePixelSize(height);

  if (!fill) {
    const fromW = parsePixelSize(w) ?? parsePixelSize(boxSize);
    const fromH = parsePixelSize(h) ?? parsePixelSize(boxSize);
    if (nextWidth == null) nextWidth = fromW;
    if (nextHeight == null) nextHeight = fromH;
    if (nextWidth != null && nextHeight == null) nextHeight = nextWidth;
    if (nextHeight != null && nextWidth == null) nextWidth = nextHeight;
  }

  const nextImageProps: NextImageProps = {
    src,
    alt: alt ?? '',
    width: nextWidth,
    height: nextHeight,
    fill,
    sizes,
    quality,
    priority,
    placeholder,
    blurDataURL,
    loading,
    unoptimized,
    loader,
    fetchPriority,
    decoding,
    overrideSrc,
    onLoad,
    onError,
    onLoadingComplete,
    style,
    className,
    id,
  };

  const hasBoxStyles =
    Object.keys(boxProps).length > 0 ||
    w != null ||
    h != null ||
    minW != null ||
    minH != null ||
    maxW != null ||
    maxH != null ||
    boxSize != null;

  if (!hasBoxStyles) {
    return <NextImage ref={ref} {...nextImageProps} />;
  }

  return (
    <Box
      {...boxProps}
      w={w}
      h={h}
      minW={minW}
      minH={minH}
      maxW={maxW}
      maxH={maxH}
      boxSize={boxSize}
      display={boxProps.display ?? 'inline-block'}
      lineHeight={boxProps.lineHeight ?? 0}
    >
      <NextImage ref={ref} {...nextImageProps} />
    </Box>
  );
});

export default Image;
