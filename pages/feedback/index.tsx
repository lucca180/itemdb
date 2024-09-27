import { Card, Center, Heading, Text, useDisclosure, Image, Box } from '@chakra-ui/react';
import Link from 'next/link';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { FeedbackModalProps } from '../../components/Modal/FeedbackModal';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../../components/Modal/FeedbackModal'),
);

const FeedbackPage = () => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Layout
      SEO={{ title: 'Feedback', description: t('Feedback.feedback-system-description') }}
      mainColor="#4A5568c7"
    >
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
      <Center gap={8} mt={10} alignItems={'stretch'}>
        <FeedbackCard
          title={t('Feedback.trade-lot-pricing')}
          description={t('Feedback.trade-lot-pricing-txt')}
          icon="https://images.neopets.com/surveyimg/sur_cards/04_island/066.jpg"
          href="/feedback/trades"
        />
        <FeedbackCard
          title={t('Feedback.contact-us')}
          description={t('Feedback.contact-us-text')}
          icon="https://images.neopets.com/press/lg_aisha_7.jpg"
          onClick={onOpen}
        />
        <FeedbackCard
          title={t('Feedback.suggestion-voting')}
          description={t('Feedback.suggestion-voting-txt')}
          icon="https://images.neopets.com/games/tradingcards/premium/0911.gif"
          href="/feedback/vote"
        />
      </Center>
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

const FeedbackCard = ({
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
}) => {
  return (
    <Card
      w={275}
      h={350}
      direction={'column'}
      alignItems={'center'}
      overflow="hidden"
      variant="outline"
      rounded={'xl'}
      p={8}
      boxShadow={'lg'}
      bg="gray.700"
      gap={2}
      textAlign={'center'}
      cursor={'pointer'}
      _hover={{ bg: 'gray.800' }}
      as={href ? Link : undefined}
      href={href}
      onClick={onClick}
    >
      <Box w="200px" h="200px" overflow={'hidden'}>
        <Image src={icon} objectFit={'cover'} alt="trading post" />
      </Box>
      <Text fontSize={'sm'} fontWeight={'bold'}>
        {title}
      </Text>
      <Text fontSize={'xs'} color="gray.400">
        {description}
      </Text>
    </Card>
  );
};
