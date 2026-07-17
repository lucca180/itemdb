import {
  Button,
  Text,
  Spinner,
  Center,
  NumberInput,
  Dialog,
  CloseButton,
  Portal,
  Flex,
  Box,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useState } from 'react';
import { ItemData, UserList, ListItemInfo, ObligatoryUserList } from '../../types';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';

export type DuplicatedItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onChange?: () => void;
  item: Pick<ItemData, 'internal_id' | 'name'>;
  list?: UserList | ObligatoryUserList;
  itemInfo: ListItemInfo;
};

const DuplicatedItemModal = (props: DuplicatedItemModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose, item, list, itemInfo, onChange } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(itemInfo.amount + 1);
  const toast = useToast();

  const confirmAdd = async () => {
    setLoading(true);
    if (!user || !list) return;
    try {
      const res = await axios.put(`/api/v1/lists/${user.username}/${list.internal_id}`, {
        items: [
          {
            list_id: list.internal_id,
            item_iid: item.internal_id,
            amount: amount,
          },
        ],
      });
      if (res.data.success) {
        toast({
          id: 'duplicated-item-added',
          title: t('Lists.item-added-to-list'),
          status: 'success',
          duration: 5000,
        });
        onChange?.();
        handleClose();
      }
    } catch (err: any) {
      console.error(err);

      setError(true);
    }
  };

  const handleClose = () => {
    onClose();
    setError(false);
    setLoading(false);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) handleClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title textTransform="capitalize">
                {t('ItemPage.change-quantity')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {!loading && !error && (
                <>
                  <Text color="gray.300">
                    {t.rich('ItemPage.x-is-already-in-y', {
                      x: item.name,
                      y: list?.name ?? '',
                      b: (chunk) => <b>{chunk}</b>,
                    })}
                    <br />
                    <br />
                    {t('ItemPage.do-you-want-to-change-its-quantity')}
                  </Text>
                  <Flex align="stretch" mt={3}>
                    <Box
                      fontSize="sm"
                      px={3}
                      py={2}
                      bg="whiteAlpha.200"
                      borderLeftRadius="md"
                      display="flex"
                      alignItems="center"
                    >
                      {t('General.new-quantity')}
                    </Box>
                    <NumberInput.Root
                      flex={1}
                      max={999}
                      min={1}
                      variant="subtle"
                      size="sm"
                      defaultValue={String(itemInfo?.amount ? itemInfo.amount + 1 : 2)}
                      onValueChange={({ value }) => setAmount(parseInt(value))}
                    >
                      <NumberInput.Input />
                      <NumberInput.Control />
                    </NumberInput.Root>
                  </Flex>
                  <Text fontSize="xs" color="gray.400">
                    {t('ItemPage.this-will-overwrite-the-existing-quantity-on-the-list')}
                  </Text>
                </>
              )}

              {error && (
                <Text color="red.500">{t('General.an-error-occured-please-try-again-later')}</Text>
              )}
              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {t('General.cancel')}
              </Button>
              {!loading && !error && (
                <Button onClick={confirmAdd} colorPalette="green">
                  {t('General.save')}
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DuplicatedItemModal;
