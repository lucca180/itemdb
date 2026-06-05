import {
  Accordion,
  Box,
  Button,
  Center,
  CloseButton,
  Dialog,
  Link,
  List,
  NativeSelect,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import axios from 'axios';
import router from 'next/router';
import { useState } from 'react';
import { useAuth } from '@utils/auth';
import { MultiplyInput } from '@components/Input/MultiplyInput';
import { ItemData, PricingInfo } from '../../types';

export type WrongPriceModalProps = {
  isOpen: boolean;
  item: ItemData;
  data?: PricingInfo;
  isLoading: boolean;
  onClose: () => void;
};

export default function WrongPriceModal(props: WrongPriceModalProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose, item, data, isLoading } = props;
  const [reportReason, setReportReason] = useState<string>('');

  const [isButtonLoading, setButtonLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [suggestedPrice, setSuggestedPrice] = useState<string>();

  const sendReport = async () => {
    setButtonLoading(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        subject_id: item.internal_id,
        json: JSON.stringify({
          message: 'User cried for help',
          reason: reportReason,
          suggestedPrice: suggestedPrice,
        }),
        user_id: user?.id,
        type: 'priceReport',
        pageInfo: router.asPath,
      });

      setButtonLoading(false);

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('ItemPage.wrongPriceHeader')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body
              fontSize={'sm'}
              css={{ '& a': { color: 'blue.200' }, b: { color: 'blue.300' } }}
            >
              {t('ItemPage.wrongPrice-0')}
              <Accordion.Root bg="gray.800" size="sm" p={2} my={3} borderRadius={'md'} collapsible>
                <Accordion.Item value="current-status" border={0}>
                  <Accordion.ItemTrigger>
                    <Box as="span" flex="1" textAlign="left">
                      <Text fontSize={'sm'} color="gray.400">
                        {t('ItemPage.current-data-status')}
                      </Text>
                    </Box>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody pb={4}>
                      {!isLoading && (
                        <>
                          <List.Root as="ul" ps={6} gap={2}>
                            <List.Item>
                              <Link asChild>
                                <MainLink
                                  prefetch={false}
                                  href={`/feedback/trades?target=${item.name}`}
                                >
                                  {t('ItemPage.waiting-pricing')}
                                </MainLink>
                              </Link>{' '}
                              -{' '}
                              {t('ItemPage.x-entries', { x: data?.waitingTrades.needPricing ?? 0 })}
                              <Text fontSize={'xs'} mb={1} color="gray.400">
                                {t('ItemPage.waiting-trades-txt')}
                              </Text>
                            </List.Item>
                            <List.Item>
                              <Link asChild>
                                <MainLink
                                  href={`/feedback/vote?target=${item.name}`}
                                  prefetch={false}
                                >
                                  {t('ItemPage.waiting-votes')}
                                </MainLink>
                              </Link>{' '}
                              -{' '}
                              {t('ItemPage.x-entries', { x: data?.waitingTrades.needVoting ?? 0 })}
                              <Text fontSize={'xs'} mb={1} color="gray.400">
                                {t('ItemPage.waiting-votes-txt')}
                              </Text>
                            </List.Item>
                            <List.Item>
                              {t('ItemPage.fresh-data')} -{' '}
                              {t('ItemPage.x-entries', { x: data?.dataStatus.fresh ?? 0 })}
                              <Text fontSize={'xs'} mb={1} color="gray.400">
                                {t('ItemPage.fresh-data-txt')}
                              </Text>
                            </List.Item>
                            <List.Item>
                              {t('ItemPage.old-data')} -{' '}
                              {t('ItemPage.x-entries', { x: data?.dataStatus.old ?? 0 })}
                              <Text fontSize={'xs'} mb={1} color="gray.400">
                                {t('ItemPage.old-data-txt')}
                              </Text>
                            </List.Item>
                          </List.Root>
                          <Text fontSize={'xs'} textAlign={'justify'} color="gray.300" my={4}>
                            {t.rich('ItemPage.algorithm-txt', {
                              b: (chunk) => <b>{chunk}</b>,
                            })}
                          </Text>
                          <Text fontSize={'xs'} textAlign={'justify'} color="gray.300">
                            {t('ItemPage.algorithm-txt2')}
                          </Text>
                        </>
                      )}
                      {isLoading && (
                        <Center>
                          <Spinner />
                        </Center>
                      )}
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              </Accordion.Root>
              {t('ItemPage.wrongPrice-1')}{' '}
              <Box bg="gray.800" px={2} py={3} my={3} borderRadius={'md'}>
                <List.Root as="ol" ps={6} gap={2} listStyle="decimal">
                  <List.Item>
                    {t.rich('ItemPage.wrongPrice-2', {
                      Link: (chunk) => (
                        <Link asChild>
                          <MainLink href="/contribute">{chunk}</MainLink>
                        </Link>
                      ),
                    })}
                  </List.Item>
                  <List.Item>
                    {t('ItemPage.wrongPrice-3')} <br />
                    <Text fontSize="xs" color="gray.400">
                      {t('ItemPage.wrongPrice-4')}
                    </Text>
                  </List.Item>
                  <List.Item>
                    {t.rich('ItemPage.wrongPrice-5', {
                      Link1: (chunk) => (
                        <Link asChild>
                          <MainLink prefetch={false} href={`/feedback/trades?target=${item.name}`}>
                            {chunk}
                          </MainLink>
                        </Link>
                      ),
                      Link2: (chunk) => (
                        <Link asChild>
                          <MainLink href={`/feedback/vote?target=${item.name}`} prefetch={false}>
                            {chunk}
                          </MainLink>
                        </Link>
                      ),
                    })}
                  </List.Item>
                  <List.Item>{t('ItemPage.wrongPrice-6')}</List.Item>
                </List.Root>
              </Box>
              {t('ItemPage.wrongPrice-7')}
              <Accordion.Root bg="gray.800" size="sm" p={2} my={3} borderRadius={'md'} collapsible>
                <Accordion.Item value="report-issue" border={0}>
                  <Accordion.ItemTrigger>
                    <Box as="span" flex="1" textAlign="left">
                      <Text fontSize={'sm'} color="gray.400">
                        {t('ItemPage.but-something-is-reaally-wrong')}
                      </Text>
                    </Box>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody pb={4} display="flex" flexFlow="column" gap={3}>
                      {t('ItemPage.wrong-price-report')}
                      <NativeSelect.Root
                        variant="subtle"
                        bg="whiteAlpha.200"
                        disabled={isSuccess}
                        size="sm"
                        borderRadius={'md'}
                      >
                        <NativeSelect.Field
                          placeholder={t('Feedback.select-reason')}
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                        >
                          <option value="outdated">{t('Feedback.last-price-is-outdated')}</option>
                          <option value="wrong">
                            {t('Feedback.last-price-is-crazy-unrealistic')}
                          </option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <MultiplyInput
                        onChange={setSuggestedPrice}
                        wrapperProps={{
                          variant: 'filled',
                          bg: 'whiteAlpha.200',
                          borderRadius: 'md',
                          isDisabled: isSuccess,
                        }}
                        inputProps={{
                          variant: 'filled',
                          placeholder: t('Feedback.suggested-price'),
                          pl: 3,
                          _placeholder: { color: 'whiteAlpha.700' },
                        }}
                      />
                      <Button
                        onClick={sendReport}
                        size="sm"
                        colorPalette={'red'}
                        loading={isButtonLoading}
                        disabled={isSuccess || !reportReason}
                      >
                        {!isSuccess && t('ItemPage.itemdb-admins-please-help')}
                        {isSuccess && t('ItemPage.thank-you-for-your-report')}
                      </Button>
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              </Accordion.Root>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose} size="sm">
                {t('General.close')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
