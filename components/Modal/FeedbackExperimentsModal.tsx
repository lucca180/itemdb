import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Switch,
  FormHelperText,
  VStack,
  Kbd,
} from '@chakra-ui/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../utils/auth';

export type FeedbackExperimentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FeedbackExperimentsModal = (props: FeedbackExperimentsModalProps) => {
  const t = useTranslations();
  const cancelRef = React.useRef(null);
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.id as keyof typeof userPref;
    const value = event.target.checked;
    console.log(key, value);
    updatePref(key, value);
  };

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {t('Feedback.experiments')}
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack gap={5}>
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={userPref?.labs_feedbackCopyEquals ?? false}
                  onChange={handleSwitch}
                  id="labs_feedbackCopyEquals"
                />
                <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'}>
                  <FormLabel htmlFor="labs_feedbackCopyEquals" mb="0">
                    {t('Feedback.sync-price-for-equal-items')}
                  </FormLabel>
                  <FormHelperText m={0}>{t('Feedback.equal-items-helper')}</FormHelperText>
                </VStack>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={userPref?.labs_feedbackShortcuts ?? false}
                  onChange={handleSwitch}
                  id="labs_feedbackShortcuts"
                />
                <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'}>
                  <FormLabel htmlFor="labs_feedbackShortcuts" mb="0">
                    {t('Feedback.multiplier-shortcuts')}
                  </FormLabel>
                  <FormHelperText m={0}>
                    {t.rich('Feedback.multiplier-shortcuts-helper', {
                      Kbd: (children) => <Kbd>{children}</Kbd>,
                    })}
                  </FormHelperText>
                </VStack>
              </FormControl>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack>
              <Button ref={cancelRef} onClick={onClose}>
                {t('General.close')}
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default FeedbackExperimentsModal;
