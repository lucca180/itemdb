import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import React from 'react';
import { useTranslations } from 'next-intl';
import CustomNumberInput from '@components/Input/CustomNumber';
import { ItemData } from '../../types';

export type CreatePriceModalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ItemData;
};

const CreatePriceModal = (props: CreatePriceModalModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, item } = props;
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
              <Dialog.Title>Create Price</Dialog.Title>
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
                <VStack>
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
                    <Checkbox.Root onCheckedChange={({ checked }) => setNewInflation(!!checked)}>
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>Inflation?</Checkbox.Label>
                    </Checkbox.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label color="gray.300">Date</Field.Label>
                    <Input
                      variant="subtle"
                      type="date"
                      name="addedAt"
                      onChange={(e) => setAddedAt(e.target.value)}
                      value={addedAt}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </Field.Root>
                </VStack>
              )}
            </Dialog.Body>
            {!loading && (
              <Dialog.Footer>
                <HStack>
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

export default CreatePriceModal;
