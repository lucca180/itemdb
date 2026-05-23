import { Button, HStack, Link, Text, Flex, Dialog, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { UserList } from '@types';

export type ExportListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const ExportListDataModal = (props: ExportListModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, list } = props;

  const link = `/api/v1/lists/${list.owner.username}/${list.internal_id}/export`;

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
                {t('Lists.export-list')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize={'sm'}>{t('Lists.export-list-text1')}</Text>
              <Flex mt={6} alignItems="center" gap={6} flexDirection="column" textAlign={'center'}>
                <Button asChild colorPalette="blue">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {t('Lists.download-csv')}
                  </a>
                </Button>
                <Text fontSize={'xs'} textAlign={'center'} color="whiteAlpha.600">
                  {t.rich('General.itemdb-data-license', {
                    Link: (children) => (
                      <Link
                        href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                        target="_blank"
                        rel="noreferrer"
                        color="blue.200"
                      >
                        {children}
                      </Link>
                    ),
                  })}
                  . {t('Lists.export-list-text2')}
                </Text>
              </Flex>
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

export default ExportListDataModal;
