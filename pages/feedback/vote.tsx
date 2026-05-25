import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import {
  Accordion,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import Link from 'next/link';
import { useState, useEffect, ReactElement, useRef, useCallback } from 'react';
import { BsArrowDownCircleFill, BsArrowUpCircleFill } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import FeedbackItem from '../../components/Feedback/FeedbackItem';
import Layout from '../../components/Layout';
import TradeTable from '../../components/Trades/TradeTable';
import { Feedback, TradeData } from '../../types';
import { useAuth } from '../../utils/auth';
import { TradeGuidelines } from './trades';
import { NextApiRequest, GetServerSidePropsContext } from 'next';
import { CheckAuth } from '../../utils/googleCloud';
import { createTranslator, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ReportFeedbackModalProps } from '../../components/Modal/ReportFeedbackModal';
import { useRouter } from 'next/router';
import { CanonicalTradeModalProps } from '../../components/Modal/CanonicalTradeModal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';
import { NewPolicyReminder } from '@components/Feedback/NewPolicyReminder';

const ReportFeedbackModal = dynamic<ReportFeedbackModalProps>(
  () => import('../../components/Modal/ReportFeedbackModal')
);

const CanonicalTradeModal = dynamic<CanonicalTradeModalProps>(
  () => import('../../components/Modal/CanonicalTradeModal')
);

const AUTO_PRICE_UID = 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1';

const FeedbackVotingPage = (props: { shouldShowReminder: boolean }) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const skippedFeedbacks = useRef<number[]>([]);
  const {
    open: isCanonicalOpen,
    onOpen: onCanonicalOpen,
    onClose: onCanonicalClose,
  } = useDisclosure();

  const isAdmin = user?.role === 'ADMIN';

  const init = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.get('/api/feedback/getLatest', {
        params: {
          itemName: router.query.target,
          wishlist: router.query.wishlist,
          order: router.query.order,
          skipList: skippedFeedbacks.current.join(','),
        },
      });

      const data: Feedback[] = res.data.map((d: Feedback) => {
        const parsed = JSON.parse(d.json);
        return {
          ...d,
          parsed: parsed,
        };
      });

      setFeedbacks(data);
      setCurrentFeedback(data[0]);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setIsLoading(false);
  }, [router.query.order, router.query.target, router.query.wishlist]);

  const handleSkip = useCallback(async () => {
    if (!currentFeedback) {
      await init();
      return;
    }

    setError('');

    skippedFeedbacks.current.push(currentFeedback.feedback_id);

    const newFeedbacks = feedbacks.filter((f) => f.feedback_id !== currentFeedback.feedback_id);

    if (!newFeedbacks.length) {
      setFeedbacks([]);
      setCurrentFeedback(undefined);
      await init();
      return;
    }

    setFeedbacks(newFeedbacks);
    setCurrentFeedback(newFeedbacks[0]);
  }, [currentFeedback, feedbacks, init]);

  const handleVote = useCallback(
    async (action: 'upvote' | 'downvote') => {
      setError('');
      setIsLoading(true);
      try {
        if (!currentFeedback) {
          await init();
          return;
        }

        const res = await axios.post('/api/feedback/vote', {
          action,
          feedback_id: currentFeedback?.feedback_id,
        });

        if (res.data.success) {
          const newFeedbacks = feedbacks.filter(
            (f) => f.feedback_id !== currentFeedback?.feedback_id
          );

          if (!newFeedbacks.length) {
            return init();
          }

          setFeedbacks(newFeedbacks);
          setCurrentFeedback(newFeedbacks[0]);
        } else throw new Error(res.data.message);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentFeedback, feedbacks, init]
  );

  useEffect(() => {
    if (!authLoading) {
      void init();
    }
  }, [authLoading, init]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const targetName = (e.target as HTMLElement | null)?.nodeName;

      if (['INPUT', 'TEXTAREA'].includes(targetName ?? '') || isLoading) return;

      if (e.key.toLowerCase() === 'd') {
        void handleVote('upvote');
      }

      if (e.key.toLowerCase() === 'a') {
        void handleVote('downvote');
      }

      if (e.key.toLowerCase() === 's') {
        void handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleSkip, handleVote, isLoading]);

  return (
    <>
      {isOpen && currentFeedback && (
        <ReportFeedbackModal feedback={currentFeedback} isOpen={isOpen} onClose={onClose} />
      )}
      {isCanonicalOpen && currentFeedback && (
        <CanonicalTradeModal
          trade={currentFeedback.parsed?.content.trade}
          isOpen={isCanonicalOpen}
          onClose={onCanonicalClose}
          refresh={init}
        />
      )}
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        breadcrumb={
          <Breadcrumbs
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: t('Layout.feedback'),
                item: '/feedback',
              },
              {
                position: 3,
                name: t('Feedback.feedback-voting'),
                item: '/feedback/vote',
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('Feedback.the-feedback-system')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>
          {t('Feedback.feedback-system-description')}
        </Text>
      </HeaderCard>
      <Flex
        mt={8}
        gap={6}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
        // css={{ b: { color: 'blue.200' } }}
      >
        <CardBase
          chakraWrapper={{ flex: 2 }}
          title={t('Feedback.voting')}
          chakra={{ bg: 'gray.700' }}
        >
          <Text>{t('Feedback.fds-pg-2')}</Text>
          <Accordion.Root collapsible multiple mt={4}>
            <Accordion.Item value="trade-pricing">
              <Accordion.ItemTrigger>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight={'bold'}>{t('Layout.trade-pricing')} </Text>
                </Box>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pb={4}>
                  <TradeGuidelines />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
          <Center mt={4} fontStyle="italic" fontSize="sm">
            {/* I love democracy - Sheev */}
          </Center>
        </CardBase>
        <Flex
          flex="1"
          flexFlow="column"
          alignItems="center"
          justifyContent="flex-start"
          h="100%"
          w="100%"
        >
          {props.shouldShowReminder && <NewPolicyReminder />}
          {isLoading && (
            <Center>
              <Spinner size="lg" />
            </Center>
          )}

          {!isLoading && !currentFeedback && !error && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('Feedback.thanks-for-helping-out-want-more')}</Text>
              <Button onClick={init}>{t('Feedback.yes-i-need-it')} (D)</Button>
              <Box>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {t('Feedback.vote-everything')}
                </Text>
                <Text fontSize="xs" color="gray.200" textAlign="center">
                  <Link href="/feedback/trades">
                    {t('Feedback.you-can-also-price-some-trades')}{' '}
                    <ExternalLinkIcon verticalAlign={'center'} />
                  </Link>
                </Text>
              </Box>
            </Center>
          )}

          {!isLoading && currentFeedback && !error && (
            <>
              <CardBase
                chakraWrapper={{ flex: 1, width: '100%' }}
                title={t('Feedback.feedback-voting')}
                chakra={{ bg: 'gray.700' }}
              >
                {currentFeedback.type === 'tradePrice' && (
                  <TradeTable
                    onReport={onOpen}
                    isAuto={currentFeedback.user_id === AUTO_PRICE_UID}
                    data={currentFeedback.parsed?.content.trade as TradeData}
                  />
                )}
                {currentFeedback.type === 'itemChange' && (
                  <FeedbackItem
                    itemNotes={currentFeedback.parsed?.content.itemNotes as string | undefined}
                    itemTags={currentFeedback.parsed?.content.itemTags as string[]}
                    item_iid={currentFeedback.subject_id as number}
                  />
                )}
              </CardBase>
              <Flex justifyContent="center" flexFlow={{ base: 'column', md: 'row' }} mt={4} gap={4}>
                <Button colorPalette="red" onClick={() => handleVote('downvote')} variant="solid">
                  <Icon as={BsArrowDownCircleFill} />
                  {isAdmin ? t('Feedback.reprove') : t('Feedback.downvote')} (A)
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  {t('General.skip')} (S)
                </Button>
                {isAdmin && <Button onClick={onCanonicalOpen}>🏷️</Button>}
                <Button
                  colorPalette="green"
                  variant="solid"
                  onClick={() => handleVote('upvote')}
                  mr={2}
                >
                  <Icon as={BsArrowUpCircleFill} />
                  {isAdmin ? t('Feedback.approve') : t('Feedback.upvote')} (D)
                </Button>
              </Flex>
            </>
          )}

          {!isLoading && error && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('General.something-went-wrong')} :(</Text>
              <Button onClick={init}>{t('General.try-again')}</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </>
  );
};

export default FeedbackVotingPage;

// const TagAndNotesGuidelines = () => {
//   const t = useTranslations();
//   return (
//     <Box>
//       {/* <Text>
//         <b>Tags</b> are used to help you find items. They should be used to describe the{' '}
//         <b>item&apos;s appearance or function</b>.<br />
//         Tags <b>should not contain any meta-information</b> about the item such as method of
//         acquisition.
//         <br />
//         Tags <b>should not contain any word of the item&apos;s name</b>.
//       </Text> */}
//       <Text>
//         {t.rich('Feedback.in-1', {
//           b: (chunks) => <b>{chunks}</b>,
//         })}
//       </Text>
//     </Box>
//   );
// };

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const check = await CheckAuth(context.req as NextApiRequest);
    if (!check.user) throw new Error('User not found');

    if (check.user.banned) {
      return {
        notFound: true,
      };
    }

    const shouldShowReminder = !(context.req.cookies['bbpb_new_policy_reminder'] === 'true');

    return {
      props: {
        messages: await loadTranslation(context.locale as string, 'feedback/vote'),
        shouldShowReminder,
        locale: context.locale,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
}

FeedbackVotingPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('Feedback.voting-feedback'),
        description: t('Feedback.feedback-system-description'),
      }}
      mainColor="#4A5568c7"
    >
      {page}
    </Layout>
  );
};
