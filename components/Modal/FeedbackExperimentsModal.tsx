import {
  Button,
  Field,
  HStack,
  Switch,
  VStack,
  Kbd,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';

export type FeedbackExperimentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FeedbackPrefKey = 'labs_feedbackCopyEquals' | 'labs_feedbackShortcuts';

const FeedbackExperimentsModal = (props: FeedbackExperimentsModalProps) => {
  const t = useTranslations();
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;

  const handleSwitch = (key: FeedbackPrefKey, checked: boolean) => {
    updatePref(key, checked);
  };

  const renderSwitch = (key: FeedbackPrefKey, label: string, helper: ReactNode) => (
    <Field.Root>
      <Switch.Root
        checked={userPref?.[key] ?? false}
        onCheckedChange={({ checked }) => handleSwitch(key, !!checked)}
        display="flex"
        alignItems="flex-start"
        gap={3}
      >
        <Switch.HiddenInput />
        <Switch.Control mt={0.5}>
          <Switch.Thumb />
        </Switch.Control>
        <VStack alignItems="flex-start" gap={0} flex={1}>
          <Switch.Label>{label}</Switch.Label>
          <Field.HelperText m={0}>{helper}</Field.HelperText>
        </VStack>
      </Switch.Root>
    </Field.Root>
  );

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
              <Dialog.Title fontSize="lg" fontWeight="bold">
                {t('Feedback.experiments')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <VStack gap={5}>
                {renderSwitch(
                  'labs_feedbackCopyEquals',
                  t('Feedback.sync-price-for-equal-items'),
                  t('Feedback.equal-items-helper')
                )}
                {renderSwitch(
                  'labs_feedbackShortcuts',
                  t('Feedback.multiplier-shortcuts'),
                  t.rich('Feedback.multiplier-shortcuts-helper', {
                    Kbd: (children) => <Kbd>{children}</Kbd>,
                  })
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

export default FeedbackExperimentsModal;
