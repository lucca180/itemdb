'use client';

import { Button } from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';

type Props = {
  labels: {
    showMore: string;
    showLess: string;
  };
  children: ReactNode;
};

export function TradeInsightsMore({ labels, children }: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {showMore && children}
      <Button
        size="xs"
        variant="subtle"
        colorPalette="whiteAlpha"
        cursor="pointer"
        onClick={() => setShowMore((prev) => !prev)}
      >
        {showMore ? labels.showLess : labels.showMore}
      </Button>
    </>
  );
}
