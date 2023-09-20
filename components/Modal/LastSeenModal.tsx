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
import NextLink from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';
export type LastSeenModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LastSeenModal(props: LastSeenModalProps) {
  const { isOpen, onClose } = props;
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How &#34;Last Seen&#34; works?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            &#34;Last Seen&#34; works thanks to users using the itemdb&apos;s{' '}
            <Link as={NextLink} href="/contribute" target="_blank" color={'gray.400'}>
              Item Data Extractor script
            </Link>
            <br />
            <br />
            Every time a user with the script stumble across an item, the script will log and send
            this data to our database.
            <br />
            <br />
            Rest assured that we do not collect any personal data - you can review our{' '}
            <Link as={NextLink} href="/privacy" target="_blank" color={'gray.400'}>
              Privacy Policy
            </Link>{' '}
            (and our{' '}
            <Link
              as={NextLink}
              href="https://github.com/lucca180/itemdb"
              isExternal
              color={'gray.400'}
            >
              Source Code
            </Link>
            ) for more information.
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button as={NextLink} href="/contribute" target="_blank" colorScheme="gray" ml={3}>
              Contribute with itemdb <Icon boxSize="12px" as={FaExternalLinkAlt} ml={1} />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
