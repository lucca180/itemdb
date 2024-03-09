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
  OrderedList,
  ListItem,
  Text,
  Box,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

export type WrongPriceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WrongPriceModal(props: WrongPriceModalProps) {
  const t = useTranslations();

  const { isOpen, onClose } = props;
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('ItemPage.wrongPriceHeader')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'} sx={{ a: { color: 'blue.200' } }}>
            {t('ItemPage.wrongPrice-0')}
            <br />
            <br />
            {t('ItemPage.wrongPrice-1')}{' '}
            <Box bg="gray.800" px={2} py={3} my={3} borderRadius={'md'}>
              <OrderedList ml={6} spacing={2}>
                <ListItem>
                  {t.rich('ItemPage.wrongPrice-2', {
                    Link: (chunk) => (
                      <Link as={NextLink} href="/contribute" isExternal>
                        {chunk}
                      </Link>
                    ),
                  })}
                </ListItem>
                <ListItem>
                  {t('ItemPage.wrongPrice-3')} <br />
                  <Text fontSize="xs" color="gray.300">
                    {t('ItemPage.wrongPrice-4')}
                  </Text>
                </ListItem>
                <ListItem>
                  {t.rich('ItemPage.wrongPrice-5', {
                    Link1: (chunk) => (
                      <Link as={NextLink} href="/feedback/trades" isExternal>
                        {chunk}
                      </Link>
                    ),
                    Link2: (chunk) => (
                      <Link as={NextLink} href="/feedback/vote" isExternal>
                        {chunk}
                      </Link>
                    ),
                  })}
                </ListItem>
                <ListItem>{t('ItemPage.wrongPrice-6')}</ListItem>
              </OrderedList>
            </Box>
            {t('ItemPage.wrongPrice-7')}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose} size="sm">
              {t('General.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
