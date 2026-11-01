'use client';

import { Alert, Box, Heading, Icon, List, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { BsXLg, BsXCircleFill, BsCheckCircleFill, BsCheckLg } from 'react-icons/bs';

type TradeGuidelinesProps = {
  forVoting?: boolean;
};

export function TradeGuidelines({ forVoting = false }: TradeGuidelinesProps) {
  const t = useTranslations();

  return (
    <Box fontSize={'sm'}>
      {forVoting ? (
        <Alert.Root status="warning" variant="subtle" borderRadius="md" mb={4} size="sm">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description fontSize="xs">
              {t('Feedback.vote-guidelines-intro')}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : (
        <Text>
          {t.rich('Feedback.pt-1', {
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
      )}
      <Heading size="md" mt={6} color="red.300">
        <Icon as={BsXLg} verticalAlign="middle" /> {t('Feedback.donts')}
      </Heading>
      <Text>{t('Feedback.pt-2')}</Text>
      <List.Root mt={3} gap={3} listStyle="none">
        <List.Item>
          <List.Indicator asChild color="red.300">
            <BsXCircleFill />
          </List.Indicator>
          {t('Feedback.pt-3')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-4')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-5')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="red.300">
            <BsXCircleFill />
          </List.Indicator>
          {t('Feedback.pt-6')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-7')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="red.300">
            <BsXCircleFill />
          </List.Indicator>
          {t('Feedback.pt-8')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-9')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-10')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="red.300">
            <BsXCircleFill />
          </List.Indicator>
          {t('Feedback.pt-11')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-12')}{' '}
          </Text>
        </List.Item>
      </List.Root>
      <Heading size="md" mt={6} color="green.300">
        <Icon as={BsCheckLg} verticalAlign="middle" /> {t('Feedback.dos')}
      </Heading>
      <List.Root mt={3} gap={3} listStyle="none">
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-13')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-14')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-15')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-20')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-21')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-22')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-23')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-24')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-25')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-26')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-27')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-28')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-16')}
          <br />
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-17')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-18')}
          </Text>
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          {t('Feedback.pt-19')}
          <br />
        </List.Item>
      </List.Root>
    </Box>
  );
}
