/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Stack,
  Flex,
  CheckboxGroup,
  Checkbox,
  Button,
} from '@chakra-ui/react';
import { format, formatDistance } from 'date-fns';
import { useEffect, useState } from 'react';
import { RestockSession } from '../../types';
import { restockShopInfo } from '../../utils/utils';
import axios from 'axios';

export type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refresh: () => void;
};

const ImportRestockModal = (props: FeedbackModalProps) => {
  const { isOpen, onClose, refresh } = props;
  const [allSessions, setSessions] = useState<RestockSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [confirmImport, setConfirmImport] = useState<'import' | 'discard' | null>(null);
  const allChecked = selectedSessions.length === allSessions.length;
  const isIndeterminate = !!selectedSessions.length && !allChecked;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const current = sessionStorage.getItem('current_sessions');
    const unsync = sessionStorage.getItem('unsync_sessions');

    let currentParsed = current ? (Object.values(JSON.parse(current)) as RestockSession[]) : [];
    const unsyncParsed = unsync ? (JSON.parse(unsync) as RestockSession[]) : [];

    currentParsed = currentParsed.map((x) => {
      x.isActive = true;
      return x;
    });

    setSessions(
      [...currentParsed, ...unsyncParsed]
        .filter((x) => x.clicks.length && Object.keys(x.items).length)
        .sort((a, b) => b.startDate - a.startDate)
    );
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (selectedSessions.includes(value)) {
      setSelectedSessions(selectedSessions.filter((x) => x !== value));
    } else {
      setSelectedSessions([...selectedSessions, value]);
    }
  };

  const handleImport = async () => {
    const sessions = allSessions.filter((x, i) => selectedSessions.includes(i.toString()));
    await axios.post('/api/v1/restock', { sessionList: sessions });

    // @ts-expect-error
    if (window && window.itemdb_restock_cleanAll)
      // @ts-expect-error
      window.itemdb_restock_cleanAll();

    handleClose();
    refresh();
  };

  const doThings = () => {
    if (confirmImport === 'import') {
      handleImport();
    } else if (confirmImport === 'discard') {
      // @ts-expect-error
      if (window && window.itemdb_restock_cleanAll)
        // @ts-expect-error
        window.itemdb_restock_cleanAll();
      handleClose();
    }
  };

  const handleClose = () => {
    setSessions([]);
    setSelectedSessions([]);
    setConfirmImport(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      {confirmImport && (
        <ModalContent>
          <ModalHeader>Import Sessions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {confirmImport === 'import' && (
              <Text fontSize="sm" sx={{ b: { color: 'green.200' } }}>
                You&apos;re about to import <b>{selectedSessions.length} restock sessions</b> to
                itemdb. All other unsynced sessions will be discarded.
                <br />
                <Text fontSize="xs" mt={3} color="whiteAlpha.500">
                  By doing this you&apos;re sending your data and it&apos;s subject to our Privacy
                  Policy and Terms of Service.
                </Text>
              </Text>
            )}
            {confirmImport === 'discard' && (
              <Text fontSize="sm" sx={{ b: { color: 'red.300' } }}>
                You&apos;re about to <b>discard all restock sessions</b> saved in your device. You
                will not be able to import them later.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant={'ghost'} mr={3} onClick={() => setConfirmImport(null)}>
              Back
            </Button>
            <Button
              size="sm"
              colorScheme={confirmImport === 'import' ? 'green' : 'red'}
              onClick={doThings}
            >
              Confirm {confirmImport === 'import' ? 'Import' : 'Discard'}
            </Button>
          </ModalFooter>
        </ModalContent>
      )}

      {!confirmImport && (
        <ModalContent>
          <ModalHeader>Import Sessions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm">
              You have a few restock sessions saved in your device.
              <br />
              Would you like to import them to itemdb?
            </Text>
            <Flex mt={3} maxH="300px" overflow={'auto'} direction="column" px={1}>
              <Checkbox
                mb={1}
                isChecked={allChecked}
                isIndeterminate={isIndeterminate}
                colorScheme="green"
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedSessions(allSessions.map((x, i) => i.toString()))
                    : setSelectedSessions([])
                }
              >
                Import All ({allSessions.length} sessions)
              </Checkbox>
              <CheckboxGroup colorScheme="green" value={selectedSessions}>
                <Stack pl={3} spacing={3} direction="column">
                  {allSessions.map((session, i) => (
                    <Checkbox value={i.toString()} key={i} onChange={handleCheckboxChange}>
                      <Flex flexFlow="column">
                        <Text color="whiteAlpha.700">
                          {formatDistance(session.lastRefresh, session.startDate)} at{' '}
                          {restockShopInfo[session.shopId].name}
                        </Text>
                        <Text as="span" fontSize={'xs'} color="whiteAlpha.500">
                          {' '}
                          {Object.keys(session.items).length} items restocked |{' '}
                          {session.clicks.filter((x) => x.buy_timestamp).length} bought{' '}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500">
                          {format(session.startDate, 'PPPPpp')}
                        </Text>
                      </Flex>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Flex>
            {/* {!allChecked && selectedSessions.length > 0 && (
             <Text fontSize="xs" textAlign={'center'} mt={3} color="whiteAlpha.800">
               Other {allSessions.length - selectedSessions.length} sessions will be discarded
             </Text>
           )} */}
          </ModalBody>
          <ModalFooter>
            <Button
              size="sm"
              colorScheme="red"
              variant={'ghost'}
              mr={3}
              onClick={() => setConfirmImport('discard')}
            >
              Discard All
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => setConfirmImport('import')}
              isDisabled={!selectedSessions.length}
            >
              Import {selectedSessions.length} Sessions
            </Button>
          </ModalFooter>
        </ModalContent>
      )}
    </Modal>
  );
};

export default ImportRestockModal;
