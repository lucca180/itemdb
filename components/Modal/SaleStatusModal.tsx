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
  IconButton,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { SaleStatus } from '../../types';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
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
  const { isOpen, onClose, saleStatus, item_iid } = props;
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   setVoted(false);
  // }, [item_iid]);

  const sendVote = async (vote: 'up' | 'down') => {
    setLoading(true);
    const res = await axios.post('/api/feedback/send', {
      subject_id: item_iid,
      json: JSON.stringify({
        message: vote,
        date: Date.now(),
        saleStatus: saleStatus,
      }),
      type: 'saleStatusFeedback',
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
              b: { color: saleStatus.status === 'ets' ? 'green.200' : 'red.200' },
            }}
          >
            <Text textAlign={'center'}>
              {t.rich('ItemPage.saleStatus-text', {
                b: (chunks) => <b>{chunks}</b>,
                Badge: () =>
                  saleStatus.status === 'ets' ? (
                    <Badge colorScheme="green">Easy to Sell</Badge>
                  ) : (
                    <Badge colorScheme="red">Hard to Sell</Badge>
                  ),
                percent: saleStatus.percent.toFixed(0),
                days: saleStatus.type === 'buyable' ? 15 : 30,
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
            <Text textAlign={'center'} mt={3}>
              {t('ItemPage.saleStatus-feedback-sale-cta')}
            </Text>
            {!voted && (
              <>
                <Center mt={2} gap={3}>
                  <IconButton
                    isLoading={loading}
                    icon={<FaThumbsUp />}
                    onClick={() => sendVote('up')}
                    variant="ghost"
                    aria-label="Upvote"
                    colorScheme="green"
                  />
                  <IconButton
                    isLoading={loading}
                    icon={<FaThumbsDown />}
                    onClick={() => sendVote('down')}
                    variant="ghost"
                    aria-label="Downvote"
                    colorScheme="red"
                  />
                </Center>
                <Text textAlign={'center'} fontSize={'xs'} color="gray.400">
                  {t('ItemPage.saleStatus-feedback-cta')}
                </Text>
              </>
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
