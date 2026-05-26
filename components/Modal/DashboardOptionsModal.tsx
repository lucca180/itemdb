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
import { useAuth } from '../../utils/auth';

export type DashboardOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type DashboardPrefKey = 'dashboard_hideMisses' | 'dashboard_hidePrev';

const DashboardOptionsModal = (props: DashboardOptionsModalProps) => {
  const t = useTranslations();
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;

  const handleSwitch = (key: DashboardPrefKey, checked: boolean) => updatePref(key, checked);

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
                <Field.Root>
                  <Switch.Root
                    checked={userPref?.dashboard_hideMisses ?? false}
                    onCheckedChange={({ checked }) =>
                      handleSwitch('dashboard_hideMisses', !!checked)
                    }
                    display="flex"
                    alignItems="center"
                  >
                    <Switch.HiddenInput id="dashboard_hideMisses" />
                    <Switch.Control />
                    <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'} gap={0}>
                      <Switch.Label>{t('Restock.hide-misses')}</Switch.Label>
                      <Field.HelperText m={0}>
                        {t('Restock.hide-misses-helper-txt')}
                      </Field.HelperText>
                    </VStack>
                  </Switch.Root>
                </Field.Root>
                <Field.Root>
                  <Switch.Root
                    checked={userPref?.dashboard_hidePrev ?? false}
                    onCheckedChange={({ checked }) => handleSwitch('dashboard_hidePrev', !!checked)}
                    display="flex"
                    alignItems="center"
                  >
                    <Switch.HiddenInput id="dashboard_hidePrev" />
                    <Switch.Control />
                    <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'} gap={0}>
                      <Switch.Label>{t('Restock.hide-comparations')}</Switch.Label>
                      <Field.HelperText m={0}>
                        {t('Restock.hide-comparations-helper-txt')}
                      </Field.HelperText>
                    </VStack>
                  </Switch.Root>
                </Field.Root>
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
