import { Text, Link, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ItemData } from '../../types';
import MainLink from '@components/Utils/MainLink';
import dynamic from 'next/dynamic';
import { RestockHistoryProps } from './RestockHistory';
import { TradeHistoryProps } from './TradeHistory';
import { AuctionHistoryProps } from './AuctionHistory';

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
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      restoreFocus={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="3xl">
            <Dialog.Header>
              <Dialog.Title>
                {lastSeenTypes[type].title} - {t('ItemPage.x-days-history', { x: 180 })}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize="sm">
              <Text mb={3} textAlign="center">
                {t.rich('ItemPage.seen-history-text', {
                  b: (chunk) => <b>{chunk}</b>,
                  Link: (chunk) => (
                    <Link asChild color="gray.400">
                      <MainLink href="/contribute">{chunk}</MainLink>
                    </Link>
                  ),
                })}
              </Text>
              {type === 'auction' && <AuctionHistory item={item} />}
              {type === 'restock' && <RestockHistory item={item} />}
              {type === 'tp' && <TradeHistory item={item} />}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
