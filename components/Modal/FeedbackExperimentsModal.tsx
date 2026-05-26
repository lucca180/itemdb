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
import { useTranslations } from 'next-intl';
import { useAuth } from '../../utils/auth';

export type FeedbackExperimentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FeedbackExperimentsModal = (props: FeedbackExperimentsModalProps) => {
  const t = useTranslations();
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;

  const handleSwitch = (key: keyof NonNullable<typeof userPref>, checked: boolean) => {
    updatePref(key, checked);
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
              <Dialog.Title fontSize="lg" fontWeight="bold">
                {t('Feedback.experiments')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <VStack gap={5}>
                <Field.Root>
                  <Switch.Root
                    checked={userPref?.labs_feedbackCopyEquals ?? false}
                    onCheckedChange={({ checked }) =>
                      handleSwitch('labs_feedbackCopyEquals', !!checked)
                    }
                    display="flex"
                    alignItems="center"
                  >
                    <Switch.HiddenInput id="labs_feedbackCopyEquals" />
                    <Switch.Control />
                    <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'} gap={0}>
                      <Switch.Label>{t('Feedback.sync-price-for-equal-items')}</Switch.Label>
                      <Field.HelperText m={0}>{t('Feedback.equal-items-helper')}</Field.HelperText>
                    </VStack>
                  </Switch.Root>
                </Field.Root>
                <Field.Root>
                  <Switch.Root
                    checked={userPref?.labs_feedbackShortcuts ?? false}
                    onCheckedChange={({ checked }) =>
                      handleSwitch('labs_feedbackShortcuts', !!checked)
                    }
                    display="flex"
                    alignItems="center"
                  >
                    <Switch.HiddenInput id="labs_feedbackShortcuts" />
                    <Switch.Control />
                    <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'} gap={0}>
                      <Switch.Label>{t('Feedback.multiplier-shortcuts')}</Switch.Label>
                      <Field.HelperText m={0}>
                        {t.rich('Feedback.multiplier-shortcuts-helper', {
                          Kbd: (children) => <Kbd>{children}</Kbd>,
                        })}
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

export default FeedbackExperimentsModal;
