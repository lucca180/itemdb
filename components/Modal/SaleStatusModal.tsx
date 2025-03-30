import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Badge,
  Center,
  Alert,
  AlertIcon,
  Flex,
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

  // useEffect(() => {
  //   setVoted(false);
  // }, [item_iid]);

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
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {t('ItemPage.saleStatus')} <Badge colorScheme="orange">Beta</Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            fontSize={'sm'}
            sx={{
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
                    {status === 'ets' && <Badge colorScheme="green">Easy to Sell</Badge>}
                    {status === 'hts' && <Badge colorScheme="red">Hard to Sell</Badge>}
                    {status === 'regular' && <Badge colorScheme="gray">Regular</Badge>}
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
            <Alert borderRadius={'md'} status="warning" fontSize={'xs'} my={3}>
              <AlertIcon />
              <Text>
                {t.rich('ItemPage.saleStatus-beta-alert', {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </Text>
            </Alert>

            {!voted && (
              <Flex
                flexFlow={'column'}
                bg="blackAlpha.600"
                borderRadius={'md'}
                p={2}
                mt={4}
                gap={3}
              >
                <Text textAlign={'center'} sx={{ textWrap: 'balance' }}>
                  {t('ItemPage.saleStatus-feedback-sale-cta')}
                </Text>
                <Center gap={3} my={2}>
                  <Button
                    size="xs"
                    onClick={() => sendVote('ets')}
                    variant={'outline'}
                    colorScheme="green"
                    isLoading={loading}
                  >
                    Easy to Sell
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => sendVote('regular')}
                    variant={'outline'}
                    colorScheme="gray"
                    isLoading={loading}
                  >
                    Regular
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => sendVote('hts')}
                    variant={'outline'}
                    colorScheme="red"
                    isLoading={loading}
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
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} size="sm">
              {t('General.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
