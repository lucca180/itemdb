import {
  Button,
  Text,
  Badge,
  Center,
  Alert,
  Flex,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { SaleStatus } from '../../types';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export type SaleStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  saleStatus: SaleStatus;
  item_iid: number;
};

export default function SaleStatusModal(props: SaleStatusModalProps) {
  const t = useTranslations();
  const formater = useFormatter();
  const { isOpen, onClose, saleStatus, item_iid } = props;
  const { status } = saleStatus;
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendVote = async (vote: 'hts' | 'ets' | 'regular') => {
    setLoading(true);
    const res = await axios.post('/api/feedback/send', {
      subject_id: item_iid,
      json: JSON.stringify({
        message: vote,
        date: Date.now(),
        saleStatus: saleStatus,
      }),
      type: 'saleStatus',
      pageInfo: router.asPath,
    });
    setLoading(false);
    if (res.data.success) {
      setVoted(true);
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
              <Dialog.Title>
                {t('ItemPage.saleStatus')} <Badge colorPalette="orange">Beta</Badge>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body
              fontSize={'sm'}
              css={{
                a: { color: 'blue.200' },
                b: {
                  color:
                    status === 'ets' ? 'green.200' : status === 'regular' ? 'gray.400' : 'red.200',
                },
              }}
            >
              <Text textAlign={'center'}>
                {t.rich('ItemPage.saleStatus-text', {
                  b: (chunks) => <b>{chunks}</b>,
                  Badge: () => (
                    <>
                      {status === 'ets' && <Badge colorPalette="green">Easy to Sell</Badge>}
                      {status === 'hts' && <Badge colorPalette="red">Hard to Sell</Badge>}
                      {status === 'regular' && <Badge colorPalette="gray">Regular</Badge>}
                    </>
                  ),
                  percent: saleStatus.percent.toFixed(0),
                  days: saleStatus.type === 'buyable' ? 15 : 30,
                })}
              </Text>
              <Text textAlign={'center'} my={3} fontSize={'xs'} color="gray.300">
                {t('ItemPage.this-was-last-updated-at', {
                  date: formater.dateTime(new Date(saleStatus.addedAt), {
                    dateStyle: 'short',
                  }),
                })}
              </Text>
              <Alert.Root
                borderRadius={'md'}
                status="warning"
                bg="colorPalette.500/15"
                variant="subtle"
                fontSize={'xs'}
                my={3}
              >
                <Alert.Indicator />
                <Alert.Content>
                  <Text>
                    {t.rich('ItemPage.saleStatus-beta-alert', {
                      b: (chunks) => <b>{chunks}</b>,
                    })}
                  </Text>
                </Alert.Content>
              </Alert.Root>

              {!voted && (
                <Flex
                  flexFlow={'column'}
                  bg="blackAlpha.400"
                  borderRadius={'md'}
                  p={2}
                  mt={4}
                  gap={3}
                >
                  <Text textAlign={'center'} css={{ textWrap: 'balance' }}>
                    {t('ItemPage.saleStatus-feedback-sale-cta')}
                  </Text>
                  <Center gap={3} my={2}>
                    <Button
                      size="xs"
                      onClick={() => sendVote('ets')}
                      variant={'outline'}
                      colorPalette="green"
                      loading={loading}
                    >
                      Easy to Sell
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => sendVote('regular')}
                      variant={'outline'}
                      colorPalette="yellow"
                      loading={loading}
                    >
                      Regular
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => sendVote('hts')}
                      variant={'outline'}
                      colorPalette="red"
                      loading={loading}
                    >
                      Hard to Sell
                    </Button>
                  </Center>
                  <Text textAlign={'center'} fontSize={'xs'} color="gray.400">
                    {t('ItemPage.saleStatus-feedback-cta')}
                  </Text>
                </Flex>
              )}
              {voted && (
                <Text textAlign={'center'} mt={2} color="gray.400">
                  {t('ItemPage.saleStatus-thanks-feedback')}
                </Text>
              )}
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
