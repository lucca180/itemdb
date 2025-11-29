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
  Link,
  Text,
  Flex,
} from '@chakra-ui/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { UserList } from '@types';

export type ExportListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const ExportListDataModal = (props: ExportListModalProps) => {
  const t = useTranslations();
  const cancelRef = React.useRef(null);
  const { isOpen, onClose, list } = props;

  const link = `/api/v1/lists/${list.owner.username}/${list.internal_id}/export`;

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
            {t('Lists.export-list')}
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text fontSize={'sm'}>{t('Lists.export-list-text1')}</Text>
            <Flex mt={6} alignItems="center" gap={6} flexDirection="column" textAlign={'center'}>
              <Button
                as="a"
                href={link}
                colorScheme="blue"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Lists.download-csv')}
              </Button>
              <Text fontSize={'xs'} textAlign={'center'} color="whiteAlpha.600">
                {t.rich('General.itemdb-data-license', {
                  Link: (children) => (
                    <Link
                      href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                      isExternal
                      color="blue.200"
                    >
                      {children}
                    </Link>
                  ),
                })}
                . {t('Lists.export-list-text2')}
              </Text>
            </Flex>
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

export default ExportListDataModal;
