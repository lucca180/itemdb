import {
  Button,
  Flex,
  Heading,
  Icon,
  ListItem,
  Text,
  UnorderedList,
  useDisclosure,
} from '@chakra-ui/react';
import Link from 'next/link';
import { BsCheckAll, BsPencilFill } from 'react-icons/bs';
import { FiSend } from 'react-icons/fi';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { FeedbackModalProps } from '../../components/Modal/FeedbackModal';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../../components/Modal/FeedbackModal')
);

const FeedbackPage = () => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout SEO={{ title: 'Feedback', description: t('Feedback.feedback-system-description') }}>
      <FeedbackModal isOpen={isOpen} onClose={onClose} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        // color="#7AB92A"
      >
        <Heading size="lg">{t('Feedback.the-feedback-system')}</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          {t('Feedback.feedback-system-description')}
        </Text>
      </HeaderCard>
      <Flex
        mt={8}
        gap={6}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
      >
        <CardBase
          chakraWrapper={{ flex: 1 }}
          title={t('Feedback.how-it-works')}
          chakra={{ bg: 'gray.700' }}
        >
          <Text>
            {t('Feedback.fds-pg-1')}
            <br />
            <br />
            {t('Feedback.fds-pg-2')}
          </Text>
          <Heading size="md" mt={6}>
            {t('Feedback.suggesting')}
          </Heading>
          <Text>{t('Feedback.as-suggesting-you-can-be-asked-to')}</Text>
          <UnorderedList mt={3}>
            <ListItem>{t('Feedback.price-trade-lots')}</ListItem>
            {/* <ListItem>Search and fill missing data</ListItem> */}
          </UnorderedList>
          <Heading size="md" mt={6}>
            {t('Feedback.voting')}
          </Heading>
          <Text>{t('Feedback.as-voting-you-can-be-asked-to')}</Text>
          <UnorderedList mt={3}>
            <ListItem>{t('Feedback.perform-fact-checking-on-the-suggested-information')}</ListItem>
            <ListItem>{t('Feedback.upvote-suggestions')}</ListItem>
            <ListItem>{t('Feedback.downvote-fraudulent-suggestions-or-spam')}</ListItem>
          </UnorderedList>
        </CardBase>
        <Flex flex="1" flexFlow="column" alignSelf="stretch" alignItems="center" gap={6}>
          <Heading size="md">{t('Feedback.i-want-to')}</Heading>
          <Flex flex="1" gap={3} flexFlow="column" justifyContent="center">
            <Button
              bg="gray.700"
              as={Link}
              href="/feedback/trades"
              p={6}
              gap={3}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={5} as={BsPencilFill} color="purple.200" />}
            >
              <Text fontSize="md" fontWeight="bold">
                {t('Feedback.price-trades')}
              </Text>
            </Button>
            <Button
              bg="gray.700"
              as={Link}
              href="/feedback/vote"
              p={6}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={10} as={BsCheckAll} color="green.200" />}
            >
              <Text fontSize="md" fontWeight="bold">
                {t('Feedback.vote-suggestions')}
              </Text>
            </Button>
            <Button
              bg="gray.700"
              onClick={onOpen}
              p={6}
              borderRadius="md"
              textAlign={'center'}
              leftIcon={<Icon boxSize={6} as={FiSend} />}
            >
              <Text fontSize="md" fontWeight="bold">
                {t('Feedback.send-feedback')}
              </Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default FeedbackPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
  };
}
