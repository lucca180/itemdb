import { Button, Link, Icon, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import { FaExternalLinkAlt } from 'react-icons/fa';

export type LastSeenModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LastSeenModal(props: LastSeenModalProps) {
  const t = useTranslations();
  const { isOpen, onClose } = props;

  return (
    <Dialog.Root
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
              <Dialog.Title>{t('ItemPage.how-last-seen-works')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize={'sm'}>
              {t.rich('ItemPage.last-seen-works', {
                Link: (chunks) => (
                  <Link asChild target="_blank" color={'blue.200'}>
                    <MainLink href="/contribute">{chunks}</MainLink>
                  </Link>
                ),
              })}
              <br />
              <br />
              {t('ItemPage.last-seen-works-2')}
              <br />
              <br />
              {t.rich('ItemPage.last-seen-works-3', {
                Privacy: (chunks) => (
                  <Link asChild target="_blank" color={'blue.200'}>
                    <MainLink href="/privacy">{chunks}</MainLink>
                  </Link>
                ),
                Source: (chunks) => (
                  <Link
                    href="https://github.com/lucca180/itemdb"
                    target="_blank"
                    rel="noreferrer"
                    color={'blue.200'}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </Dialog.Body>
            <Dialog.Footer>
              <Button size="sm" variant="ghost" onClick={onClose}>
                {t('General.close')}
              </Button>
              <Button asChild size="sm" colorPalette="whiteAlpha" variant="subtle" ml={3}>
                <MainLink href="/contribute" target="_blank">
                  {t('General.contribute-with-itemdb')}{' '}
                  <Icon boxSize="12px" as={FaExternalLinkAlt} ml={1} />
                </MainLink>
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
