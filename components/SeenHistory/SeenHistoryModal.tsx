import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Link,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ItemData } from '../../types';
import { AuctionHistoryProps } from './AuctionHistory';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { RestockHistoryProps } from './RestockHistory';
import { TradeHistoryProps } from './TradeHistory';

const AuctionHistory = dynamic<AuctionHistoryProps>(() => import('./AuctionHistory'));
const RestockHistory = dynamic<RestockHistoryProps>(() => import('./RestockHistory'));
const TradeHistory = dynamic<TradeHistoryProps>(() => import('./TradeHistory'));

export type SeenHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  type: 'tp' | 'auction' | 'restock';
};

export default function SeenHistoryModal(props: SeenHistoryModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, item, type } = props;

  const lastSeenTypes = {
    sw: {
      title: t('General.shop-wizard'),
    },
    tp: {
      title: t('General.trading-post'),
    },
    auction: {
      title: t('General.auction-house'),
    },
    restock: {
      title: t('General.restock-shop'),
    },
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={'3xl'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {lastSeenTypes[type].title} - {t('ItemPage.x-days-history', { x: 180 })}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'}>
            <Text mb={3} textAlign={'center'}>
              {t.rich('ItemPage.seen-history-text', {
                b: (chunk) => <b>{chunk}</b>,
                Link: (chunk) => (
                  <Link as={NextLink} href="/contribute" color={'gray.400'}>
                    {chunk}
                  </Link>
                ),
              })}
            </Text>
            {type === 'auction' && <AuctionHistory item={item} />}
            {type === 'restock' && <RestockHistory item={item} />}
            {type === 'tp' && <TradeHistory item={item} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
