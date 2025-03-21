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
  Textarea,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData, PriceData } from '../../types';
import { useTranslations } from 'next-intl';
import CustomNumberInput from '../Input/CustomNumber';

export type AdminEditPriceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  itemPrice: PriceData | null;
};

const AdminEditPriceModal = (props: AdminEditPriceModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, item, itemPrice } = props;
  const cancelRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [newPriceVal, setNewPriceVal] = React.useState(props.itemPrice?.value ?? null);
  const [newInflation, setNewInflation] = React.useState<undefined | boolean>(undefined);
  const [priceContext, setPriceContext] = React.useState(props.itemPrice?.context ?? '');

  useEffect(() => {
    setNewPriceVal(itemPrice?.value ?? null);
  }, [itemPrice]);

  const onConfirm = async () => {
    if (!itemPrice) return;
    setLoading(true);

    try {
      const res = await axios.post(`/api/admin/prices/${itemPrice.price_id}`, {
        newPrice: newPriceVal,
        isInflation: newInflation,
        item_iid: item.internal_id,
        priceContext: priceContext || undefined,
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

  const deletePrice = async () => {
    if (!itemPrice) return;
    setLoading(true);

    try {
      const res = await axios.delete(`/api/admin/prices/${itemPrice.price_id}`);

      if (res.status === 200) {
        setMsg('Price deleted, please refresh the page to see the changes');
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

  if (!props.itemPrice) return null;

  if (msg)
    return (
      <AlertDialog isOpen leastDestructiveRef={cancelRef as any} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Edit Price
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
              Edit Price
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
            Edit Price
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack gap={5}>
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
                <Checkbox
                  defaultChecked={props.itemPrice.inflated}
                  onChange={(e) => setNewInflation(e.target.checked)}
                >
                  Inflation?
                </Checkbox>
              </FormControl>
              <FormControl>
                <FormLabel>Price Context</FormLabel>
                <Textarea
                  variant="filled"
                  onChange={(e) => setPriceContext(e.target.value)}
                  value={priceContext}
                />
              </FormControl>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack>
              <Button onClick={deletePrice} colorScheme="red" variant={'ghost'}>
                Delete Price
              </Button>
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

export default AdminEditPriceModal;
