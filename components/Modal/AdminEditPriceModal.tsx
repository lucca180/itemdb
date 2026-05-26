import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Portal,
  Spinner,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import CustomNumberInput from '@components/Input/CustomNumber';
import { ItemData, PriceData } from '../../types';

export type AdminEditPriceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
  itemPrice: PriceData | null;
};

const AdminEditPriceModal = (props: AdminEditPriceModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, item, itemPrice } = props;
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [newPriceVal, setNewPriceVal] = React.useState(props.itemPrice?.value ?? null);
  const [newInflation, setNewInflation] = React.useState<undefined | boolean>(undefined);
  const [priceContext, setPriceContext] = React.useState(props.itemPrice?.context ?? '');

  const onConfirm = async () => {
    if (!itemPrice) return;
    setLoading(true);

    try {
      const res = await axios.post(`/api/admin/prices/${itemPrice.price_id}`, {
        newPrice: newPriceVal,
        isInflation: newInflation,
        item_iid: item.internal_id,
        priceContext: priceContext,
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewPriceVal(itemPrice?.value ?? null);
  }, [itemPrice]);

  if (!props.itemPrice) return null;

  return (
    <Dialog.Root
      role="alertdialog"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open && !loading) onClose();
      }}
      placement="center"
      closeOnEscape={!loading}
      closeOnInteractOutside={!loading}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit Price</Dialog.Title>
            </Dialog.Header>
            {!loading && (
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            )}
            <Dialog.Body>
              {msg ? (
                msg
              ) : loading ? (
                <Spinner />
              ) : (
                <VStack gap={5}>
                  <Field.Root>
                    <Field.Label>New Price</Field.Label>
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
                  </Field.Root>
                  <Field.Root>
                    <Checkbox.Root
                      checked={newInflation ?? props.itemPrice.inflated}
                      onCheckedChange={({ checked }) => setNewInflation(!!checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>Inflation?</Checkbox.Label>
                    </Checkbox.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Price Context</Field.Label>
                    <Textarea
                      variant="subtle"
                      onChange={(e) => setPriceContext(e.target.value)}
                      value={priceContext}
                    />
                  </Field.Root>
                </VStack>
              )}
            </Dialog.Body>
            {!loading && (
              <Dialog.Footer>
                <HStack>
                  {!msg && (
                    <Button onClick={deletePrice} colorPalette="red" variant="ghost">
                      Delete Price
                    </Button>
                  )}
                  <Button onClick={onClose}>{t('General.close')}</Button>
                  {!msg && (
                    <Button colorPalette="green" onClick={onConfirm}>
                      {t('General.save')}
                    </Button>
                  )}
                </HStack>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AdminEditPriceModal;
