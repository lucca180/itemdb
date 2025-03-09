import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Spinner,
  FormControl,
  FormLabel,
  Checkbox,
  VStack,
  HStack,
  Input,
} from '@chakra-ui/react';
import axios from 'axios';
import React from 'react';
import { ItemData } from '../../types';
import { useTranslations } from 'next-intl';
import CustomNumberInput from '../Input/CustomNumber';

export type CreatePriceModalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
};

const CreatePriceModal = (props: CreatePriceModalModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, item } = props;
  const cancelRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [newPriceVal, setNewPriceVal] = React.useState<number | null>(null);
  const [newInflation, setNewInflation] = React.useState<undefined | boolean>(undefined);
  const [addedAt, setAddedAt] = React.useState<string>('');

  const onConfirm = async () => {
    setLoading(true);

    try {
      const res = await axios.post(`/api/admin/prices/`, {
        price: newPriceVal,
        isInflation: newInflation,
        item_iid: item.internal_id,
        addedAt: addedAt,
      });

      if (res.status === 200) {
        setMsg('Price updated, please refresh the page to see the changes');
        setLoading(false);
      }
    } catch (err) {
      setMsg(t('General.something-went-wrong-please-try-again-later'));
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    const price = val ? parseInt(val) : null;

    setNewPriceVal(price);
  };

  if (msg)
    return (
      <AlertDialog isOpen leastDestructiveRef={cancelRef as any} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Create Price
            </AlertDialogHeader>
            <AlertDialogBody>{msg}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('General.close')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );

  if (loading)
    return (
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef as any}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClose={() => {}}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Create Price
            </AlertDialogHeader>
            <AlertDialogBody>
              <Spinner />
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );

  return (
    <AlertDialog isOpen leastDestructiveRef={cancelRef as any} onClose={onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Create Price
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack>
              <FormControl>
                <FormLabel>New Price</FormLabel>
                <CustomNumberInput
                  skipDebounce
                  wrapperProps={{
                    variant: 'filled',
                    size: 'sm',
                    placeholder: t('General.np-price'),
                  }}
                  inputProps={{
                    placeholder: t('General.np-price'),
                    textAlign: 'left',
                  }}
                  value={newPriceVal?.toString()}
                  onChange={(val) => handleChange(val)}
                />
              </FormControl>
              <FormControl>
                <Checkbox onChange={(e) => setNewInflation(e.target.checked)}>Inflation?</Checkbox>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.300">Date</FormLabel>
                <Input
                  variant="filled"
                  type="date"
                  name="addedAt"
                  onChange={(e) => setAddedAt(e.target.value)}
                  value={addedAt}
                />
              </FormControl>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack>
              <Button ref={cancelRef} onClick={onClose}>
                {t('General.close')}
              </Button>
              <Button colorScheme="green" onClick={onConfirm}>
                {t('General.save')}
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default CreatePriceModal;
