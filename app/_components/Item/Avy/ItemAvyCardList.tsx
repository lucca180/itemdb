'use client';

import { Button, Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import Image from '@components/Utils/Image';
import Markdown from '@components/Utils/Markdown';
import Link from '@components/Utils/MainLink';
import type { AvyData } from '@types';

type Props = {
  avyData: AvyData[];
  labels: {
    showMore: string;
    showLess: string;
    itemList: string;
  };
};

export function ItemAvyCardList({ avyData, labels }: Props) {
  const [seeMore, setSeeMore] = useState(false);

  return (
    <Flex gap={3} flexFlow="column">
      {avyData.slice(0, seeMore ? avyData.length : 3).map((avy) => (
        <AvyRow key={avy.name} avy={avy} itemListLabel={labels.itemList} />
      ))}
      {avyData.length > 3 && (
        <Button
          onClick={() => setSeeMore(!seeMore)}
          size="xs"
          data-umami-event="avyCard"
          data-umami-event-label="see-more"
        >
          {seeMore ? labels.showLess : labels.showMore}
        </Button>
      )}
    </Flex>
  );
}

function AvyRow({ avy, itemListLabel }: { avy: AvyData; itemListLabel: string }) {
  return (
    <Flex gap={2} bg="blackAlpha.500" p={3} borderRadius="md" alignItems="center" fontSize="sm">
      <Image src={avy.img} alt={avy.name} width={30} height={30} unoptimized />
      <Flex
        flexFlow="column"
        gap={1}
        css={{ '& a': { color: 'whiteAlpha.800' }, 'a:hover': { textDecoration: 'underline' } }}
      >
        <Text fontWeight="semibold">{avy.name}</Text>
        <Text fontSize="xs" color="whiteAlpha.600" as="div">
          <Markdown>{avy.solution}</Markdown>
        </Text>
        {avy.list && (
          <Text fontSize="xs">
            <Link
              trackEvent="avyCard"
              trackEventLabel="item-list"
              href={`/lists/official/${avy.list.slug}`}
            >
              {itemListLabel}
            </Link>
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
