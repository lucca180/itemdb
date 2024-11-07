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
} from '@chakra-ui/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../utils/auth';

export type DashboardOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DashboardOptionsModal = (props: DashboardOptionsModalProps) => {
  const t = useTranslations();
  const cancelRef = React.useRef(null);
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose } = props;

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.id as keyof typeof userPref;
    const value = event.target.checked;

    updatePref(key, value);
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef as any}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {t('Restock.dashboard-options')}
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack gap={5}>
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={userPref?.dashboard_hideMisses ?? false}
                  onChange={handleSwitch}
                  id="dashboard_hideMisses"
                />
                <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'}>
                  <FormLabel htmlFor="dashboard_hideMisses" mb="0">
                    {t('Restock.hide-misses')}
                  </FormLabel>
                  <FormHelperText m={0}>{t('Restock.hide-misses-helper-txt')}</FormHelperText>
                </VStack>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={userPref?.dashboard_hidePrev ?? false}
                  onChange={handleSwitch}
                  id="dashboard_hidePrev"
                />
                <VStack justifyContent={'flex-start'} ml={2} alignItems={'flex-start'}>
                  <FormLabel htmlFor="dashboard_hidePrev" mb="0">
                    {t('Restock.hide-comparations')}
                  </FormLabel>
                  <FormHelperText m={0}>{t('Restock.hide-comparations-helper-txt')}</FormHelperText>
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

export default DashboardOptionsModal;
