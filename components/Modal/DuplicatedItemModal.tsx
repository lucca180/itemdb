import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Spinner,
  Center,
  useToast,
  InputGroup,
  InputLeftAddon,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { ItemData, UserList, ListItemInfo, ObligatoryUserList } from '../../types';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';

export type DuplicatedItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onChange?: () => void;
  item: ItemData;
  list?: UserList | ObligatoryUserList;
  itemInfo: ListItemInfo;
};

const DuplicatedItemModal = (props: DuplicatedItemModalProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isOpen, onClose, item, list, itemInfo, onChange } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
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
    <Modal isOpen={isOpen} onClose={handleClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textTransform="capitalize">{t('ItemPage.change-quantity')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isLoading && !error && (
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
              <InputGroup size="sm" mt={3}>
                <InputLeftAddon children={t('General.new-quantity')} />
                <NumberInput
                  max={999}
                  min={1}
                  variant="filled"
                  defaultValue={itemInfo?.amount ? itemInfo.amount + 1 : 2}
                  onChange={(value) => setAmount(parseInt(value))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </InputGroup>
              <Text fontSize="xs" color="gray.400">
                {t('ItemPage.this-will-overwrite-the-existing-quantity-on-the-list')}
              </Text>
            </>
          )}

          {error && (
            <Text color="red.500">{t('General.an-error-occured-please-try-again-later')}</Text>
          )}
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('General.cancel')}
          </Button>
          {!isLoading && !error && (
            <Button onClick={confirmAdd} colorScheme="green">
              {t('General.save')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DuplicatedItemModal;
