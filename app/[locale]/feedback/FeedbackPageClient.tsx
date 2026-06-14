'use client';

import { Card, Center, useDisclosure, Image, Box, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import { FeedbackModalProps } from '@components/Modal/FeedbackModal';
import dynamic from 'next/dynamic';
import type { FeedbackCardLabels } from './buildFeedbackPageProps';

const FeedbackModal = dynamic<FeedbackModalProps>(() => import('@components/Modal/FeedbackModal'));

type FeedbackPageClientProps = {
  cards: FeedbackCardLabels;
};

export function FeedbackPageClient({ cards }: FeedbackPageClientProps) {
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <Center
        gap={8}
        mt={10}
        flexFlow={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'center', md: 'stretch' }}
      >
        <FeedbackCard
          title={cards.tradesTitle}
          description={cards.tradesDescription}
          icon="https://images.neopets.com/surveyimg/sur_cards/04_island/066.jpg"
          href="/feedback/trades"
        />
        <FeedbackCard
          title={cards.contactTitle}
          description={cards.contactDescription}
          icon="https://images.neopets.com/press/lg_aisha_7.jpg"
          onClick={onOpen}
        />
        <FeedbackCard
          title={cards.voteTitle}
          description={cards.voteDescription}
          icon="https://images.neopets.com/games/tradingcards/premium/0911.gif"
          href="/feedback/vote"
        />
      </Center>
    </>
  );
}

function FeedbackCard({
  title,
  description,
  icon,
  href,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}) {
  const cardContent = (
    <>
      <Box w="200px" h="200px" overflow={'hidden'}>
        <Image src={icon} objectFit={'cover'} alt="trading post" />
      </Box>
      <Text fontSize={'sm'} fontWeight={'bold'}>
        {title}
      </Text>
      <Text fontSize={'xs'} color="gray.400">
        {description}
      </Text>
    </>
  );

  const cardProps = {
    w: 275,
    h: ['auto', 350] as const,
    overflow: 'hidden' as const,
    variant: 'outline' as const,
    rounded: 'xl' as const,
    p: [3, 8] as const,
    boxShadow: 'lg' as const,
    bg: 'gray.700',
    gap: 2,
    textAlign: 'center' as const,
    _hover: { bg: 'gray.800' },
  };

  if (href) {
    return (
      <Card.Root {...cardProps} asChild cursor="pointer">
        <MainLink href={href}>{cardContent}</MainLink>
      </Card.Root>
    );
  }

  return (
    <Card.Root {...cardProps} cursor="pointer" onClick={onClick}>
      {cardContent}
    </Card.Root>
  );
}
