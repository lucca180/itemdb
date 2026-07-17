import {
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Portal,
  Switch,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@utils/auth';

export type DashboardOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type DashboardPrefKey = 'dashboard_hideMisses' | 'dashboard_hidePrev';

const DashboardOptionsModal = (props: DashboardOptionsModalProps) => {
  const t = useTranslations();
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;
  const [prefOverrides, setPrefOverrides] = useState<Partial<Record<DashboardPrefKey, boolean>>>(
    {}
  );

  const getPrefValue = (key: DashboardPrefKey) => prefOverrides[key] ?? userPref?.[key] ?? false;

  const handleSwitch = (key: DashboardPrefKey, checked: boolean) => {
    setPrefOverrides((prev) => ({ ...prev, [key]: checked }));
    updatePref(key, checked);
  };

  const renderSwitch = (key: DashboardPrefKey, label: string, helperText: ReactNode) => {
    const checked = getPrefValue(key);

    return (
      <Field.Root>
        <Switch.Root
          checked={checked}
          onCheckedChange={({ checked }) => handleSwitch(key, !!checked)}
          ids={{ hiddenInput: key }}
          display="flex"
          alignItems="flex-start"
          gap={3}
          cursor="pointer"
        >
          <Switch.HiddenInput />
          <Switch.Control mt={0.5}>
            <Switch.Thumb />
          </Switch.Control>
          <VStack justifyContent={'flex-start'} alignItems={'flex-start'} gap={0}>
            <Switch.Label cursor="pointer">{label}</Switch.Label>
            <Field.HelperText m={0}>{helperText}</Field.HelperText>
          </VStack>
        </Switch.Root>
      </Field.Root>
    );
  };

  return (
    <Dialog.Root
      role="alertdialog"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Restock.dashboard-options')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <VStack gap={5}>
                {renderSwitch(
                  'dashboard_hideMisses',
                  t('Restock.hide-misses'),
                  t('Restock.hide-misses-helper-txt')
                )}
                {renderSwitch(
                  'dashboard_hidePrev',
                  t('Restock.hide-comparations'),
                  t('Restock.hide-comparations-helper-txt')
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack>
                <Button onClick={onClose}>{t('General.close')}</Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DashboardOptionsModal;
