'use client';

import { Text, useMediaQuery } from '@chakra-ui/react';

export function MobileDeviceWarning({ text }: { text: string }) {
  const [isLargerThanMD] = useMediaQuery(['(min-width: 48em)'], { fallback: [true] });

  if (isLargerThanMD) {
    return null;
  }

  return (
    <Text fontSize="sm" color="red.400">
      {text}
    </Text>
  );
}
