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
} from '@chakra-ui/react';
import { TradeData } from '../../types';
import { useMemo, useState } from 'react';
import axios from 'axios';

export type CanonicalTradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeData;
  refresh: () => void;
};

export default function CanonicalTradeModal(props: CanonicalTradeModalProps) {
  const { isOpen, onClose, trade, refresh } = props;
  const [isLoading, setIsLoading] = useState(false);

  const isAllEqual = useMemo(
    () =>
      trade.items.every(
        (item) => item.name === trade.items[0].name && item.image_id === trade.items[0].image_id
      ),
    [trade.items]
  );

  const handleClose = async () => {
    if (isLoading) return;

    onClose();
  };

  const handleSetCanonical = async () => {
    setIsLoading(true);
    const res = await axios.post(`/api/v1/trades/${trade.trade_id}/canonical`);

    if (res.status === 200) {
      refresh();
      onClose();
    }

    setIsLoading(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Canonical Trade</ModalHeader>
          <ModalCloseButton />
          <ModalBody
            fontSize={'sm'}
            sx={{
              a: { color: 'blue.200' },
            }}
          >
            <Text textAlign={'center'}>
              Are you sure that this pricing also applies for <b>EVERY</b>{' '}
              <Badge colorScheme="cyan">{trade.items.length} items</Badge>
              <Badge colorScheme="yellow" ml={1}>
                {isAllEqual ? 'all equal items' : 'diferent items'}
              </Badge>{' '}
              trade lots?
            </Text>
          </ModalBody>
          <ModalFooter justifyContent={'center'} alignItems={'center'} gap={5}>
            <Button variant={'ghost'} colorScheme="red" onClick={handleClose} isLoading={isLoading}>
              No
            </Button>
            <Button
              variant={'ghost'}
              colorScheme="green"
              onClick={handleSetCanonical}
              isLoading={isLoading}
            >
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
