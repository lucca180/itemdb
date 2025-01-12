// Image.js
import { chakra } from '@chakra-ui/react';
import Image from 'next/image';

const imageProps = [
  'src',
  'alt',
  'sizes',
  'width',
  'height',
  'fill',
  'loader',
  'quality',
  'priority',
  'loading',
  'placeholder',
  'blurDataURL',
  'unoptimized',
  'onLoadingComplete',
  'alt',
  'crossOrigin',
  'decoding',
  'loading',
  'referrerPolicy',
  'sizes',
  'src',
  'useMap',
];

export default chakra(Image, {
  shouldForwardProp: (prop) => imageProps.includes(prop),
});
