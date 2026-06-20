import { Button, Text, Badge, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import { TradeData } from '../../types';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { getCanonicalItemsCount, isTradeAllItemsEqual } from '@utils/item/tradeCanonical';

export type CanonicalTradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeData;
  refresh: () => void;
};

export default function CanonicalTradeModal(props: CanonicalTradeModalProps) {
  const { isOpen, onClose, trade, refresh } = props;
  const [loading, setLoading] = useState(false);

  const isAllEqual = useMemo(() => isTradeAllItemsEqual(trade), [trade]);
  const itemCount = useMemo(() => getCanonicalItemsCount(trade.items), [trade.items]);

  const handleClose = async () => {
    if (loading) return;
    onClose();
  };

  const handleSetCanonical = async () => {
    setLoading(true);
    const res = await axios.post(`/api/v1/trades/${trade.trade_id}/canonical`);

    if (res.status === 200) {
      refresh();
      onClose();
    }

    setLoading(false);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Canonical Trade</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body
              fontSize={'sm'}
              css={{
                a: { color: 'blue.200' },
              }}
            >
              <Text textAlign={'center'}>
                Are you sure that this pricing also applies for <b>EVERY</b>{' '}
                <Badge colorPalette="cyan">{itemCount} items</Badge>
                <Badge colorPalette="yellow" ml={1}>
                  {isAllEqual ? 'all equal items' : 'different items'}
                </Badge>{' '}
                trade lots?
              </Text>
            </Dialog.Body>
            <Dialog.Footer justifyContent={'center'} alignItems={'center'} gap={5}>
              <Button variant={'ghost'} colorPalette="red" onClick={handleClose} loading={loading}>
                No
              </Button>
              <Button
                variant={'ghost'}
                colorPalette="green"
                onClick={handleSetCanonical}
                loading={loading}
              >
                Yes
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
