import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Link,
  Icon,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';
export type LastSeenModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LastSeenModal(props: LastSeenModalProps) {
  const t = useTranslations();

  const { isOpen, onClose } = props;
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('ItemPage.how-last-seen-works')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'}>
            {t.rich('ItemPage.last-seen-works', {
              Link: (chunks) => (
                <Link as={NextLink} href="/contribute" target="_blank" color={'blue.200'}>
                  {chunks}
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
                <Link as={NextLink} href="/privacy" target="_blank" color={'blue.200'}>
                  {chunks}
                </Link>
              ),
              Source: (chunks) => (
                <Link
                  as={NextLink}
                  href="https://github.com/lucca180/itemdb"
                  isExternal
                  color={'blue.200'}
                >
                  {chunks}
                </Link>
              ),
            })}
          </ModalBody>

          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t('General.close')}
            </Button>
            <Button
              size="sm"
              as={NextLink}
              href="/contribute"
              target="_blank"
              colorScheme="gray"
              ml={3}
            >
              {t('General.contribute-with-itemdb')}{' '}
              <Icon boxSize="12px" as={FaExternalLinkAlt} ml={1} />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
