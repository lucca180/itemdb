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
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { formatDistance } from 'date-fns';
import { useEffect, useState } from 'react';
import { RestockSession } from '../../types';
import { restockShopInfo } from '../../utils/utils';
import axios from 'axios';
import { useFormatter, useTranslations } from 'next-intl';
import { useRef } from 'react';
import { ViewportList } from 'react-viewport-list';

export type ImportRestockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refresh: () => void;
};

const MAX_SESSIONS = 50;

const ImportRestockModal = (props: ImportRestockModalProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const toast = useToast();
  const ref = useRef<HTMLDivElement | null>(null);
  const { isOpen, onClose, refresh } = props;
  const [allSessions, setSessions] = useState<RestockSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [confirmImport, setConfirmImport] = useState<'import' | 'discard' | null>(null);
  const [loading, setLoading] = useState(false);
  const allChecked =
    selectedSessions.length === allSessions.length || selectedSessions.length === MAX_SESSIONS;
  const isIndeterminate = !!selectedSessions.length && !allChecked;

  useEffect(() => {
    if (!isOpen) return;
    init();
  }, [isOpen]);

  const init = async () => {
    if (!window) return;
    let currentParsed: RestockSession[] = [];
    let unsyncParsed: RestockSession[] = [];

    if (window.itemdb_restock) {
      const { current_sessions, unsync_sessions } = window.itemdb_restock.getSessions();
      currentParsed = Object.values(current_sessions);
      unsyncParsed = unsync_sessions;
    }

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
    } else if (selectedSessions.length < MAX_SESSIONS) {
      setSelectedSessions([...selectedSessions, value]);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const sessions = allSessions.filter((x, i) => selectedSessions.includes(i.toString()));
      if (!isSerializable(sessions)) {
        console.error('Invalid session data:', sessions);
        toast({
          title: t('General.error'),
          description: <ResetToastMsg />,
          status: 'error',
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      await axios.post(
        '/api/v1/restock',
        { sessionList: sessions },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (window && window.itemdb_restock) {
        window.itemdb_restock.cleanAll();
      }

      handleClose();
      refresh();
    } catch (e) {
      toast({
        title: t('General.error'),
        description: t('General.something-went-wrong-please-try-again-later'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      console.error(e);

      setLoading(false);
    }
  };

  const doThings = () => {
    if (confirmImport === 'import') {
      handleImport();
    }

    if (confirmImport === 'discard') {
      if (window && window.itemdb_restock) {
        window.itemdb_restock.cleanAll();
      }

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
      {loading && (
        <ModalContent>
          <ModalHeader>{t('Restock.import-sessions')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center>
              <Spinner />
            </Center>
          </ModalBody>
        </ModalContent>
      )}
      {confirmImport && !loading && (
        <ModalContent>
          <ModalHeader>{t('Restock.import-sessions')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {confirmImport === 'import' && (
              <Text fontSize="sm" sx={{ b: { color: 'green.200' } }}>
                {t.rich('Restock.import-modal-1', {
                  b: (chunk) => <b>{chunk}</b>,
                  x: selectedSessions.length,
                })}
                <br />
                <Text fontSize="xs" mt={3} color="whiteAlpha.500">
                  {t('Restock.import-modal-2')}
                </Text>
              </Text>
            )}
            {confirmImport === 'discard' && (
              <Text fontSize="sm" sx={{ b: { color: 'red.300' } }}>
                {t.rich('Restock.import-modal-3', {
                  b: (chunk) => <b>{chunk}</b>,
                })}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant={'ghost'} mr={3} onClick={() => setConfirmImport(null)}>
              {t('General.back')}
            </Button>
            <Button
              size="sm"
              colorScheme={confirmImport === 'import' ? 'green' : 'red'}
              onClick={doThings}
            >
              {t('General.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      )}

      {!confirmImport && !loading && (
        <ModalContent>
          <ModalHeader>{t('Restock.import-sessions')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm">
              {t('Restock.import-modal-4')} {t('Restock.import-modal-5')}
            </Text>
            <Text fontSize={'sm'} color="red.300" textAlign={'center'} mt={3}>
              {t('Restock.dashboard-limits', { x: MAX_SESSIONS })}
            </Text>
            <Flex mt={3} maxH="300px" overflow={'auto'} direction="column" px={1} ref={ref}>
              <Checkbox
                mb={1}
                isChecked={allChecked}
                isIndeterminate={isIndeterminate}
                colorScheme="green"
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedSessions(
                        allSessions.slice(0, MAX_SESSIONS).map((x, i) => i.toString())
                      )
                    : setSelectedSessions([])
                }
              >
                {allSessions.length <= MAX_SESSIONS &&
                  t('Restock.import-modal-import-all-x', { x: allSessions.length })}
                {allSessions.length > MAX_SESSIONS &&
                  t('Restock.import-latest-x-sessions', { x: MAX_SESSIONS })}
              </Checkbox>
              <CheckboxGroup colorScheme="green" value={selectedSessions}>
                <Stack pl={3} spacing={3} direction="column">
                  <ViewportList viewportRef={ref} items={allSessions}>
                    {(session, i) => (
                      <Checkbox value={i.toString()} key={i} onChange={handleCheckboxChange}>
                        <Flex flexFlow="column">
                          <Text color="whiteAlpha.700">
                            {t('Restock.import-modal-x-time-at-y-store', {
                              x: formatDistance(session.lastRefresh, session.startDate),
                              y: restockShopInfo[session.shopId].name,
                            })}
                          </Text>
                          <Text as="span" fontSize={'xs'} color="whiteAlpha.500">
                            {' '}
                            {t('Restock.import-modal-x-items-restocked', {
                              x: Object.keys(session.items).length,
                            })}{' '}
                            |{' '}
                            {t('Restock.import-modal-x-bought', {
                              x: session.clicks.filter((x) => x.buy_timestamp).length,
                            })}{' '}
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.500">
                            {format.dateTime(session.startDate, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </Flex>
                      </Checkbox>
                    )}
                  </ViewportList>
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
              {t('Restock.import-modal-discard-all')}
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => setConfirmImport('import')}
              isDisabled={!selectedSessions.length || selectedSessions.length > MAX_SESSIONS}
            >
              {t('Restock.import-modal-import-x-sessions', { x: selectedSessions.length })}
            </Button>
          </ModalFooter>
        </ModalContent>
      )}
    </Modal>
  );
};

export default ImportRestockModal;

function isSerializable(obj: any): boolean {
  const seen = new WeakSet();

  function check(value: any): boolean {
    if (value === null) return true;
    const type = typeof value;

    if (type === 'string' || type === 'number' || type === 'boolean') {
      if (Number.isNaN(value) || value === Infinity || value === -Infinity) {
        console.error('[RestockImport] Non-serializable value found:', value, type);
        return false;
      }
      return true;
    }

    if (type === 'bigint' || type === 'symbol' || type === 'function' || type === 'undefined') {
      console.error('[RestockImport] Non-serializable value found:', value, type);
      return false;
    }

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        console.error('[RestockImport] Non-serializable value found:', value, 'Circular reference');
        return false;
      }
      seen.add(value);
      return value.every(check);
    }

    if (type === 'object') {
      if (seen.has(value)) {
        console.error('[RestockImport] Non-serializable value found:', value, 'Circular reference');
        return false;
      }

      seen.add(value);
      return Object.values(value).every(check);
    }

    return false;
  }

  return check(obj);
}

const ResetToastMsg = () => {
  const t = useTranslations();

  const resetAll = () => {
    if (window && window.itemdb_restock) {
      window.itemdb_restock.cleanAll();
      window.location.reload();
    }
  };

  return (
    <Flex flexFlow={'column'} gap={1}>
      <Text>{t('Restock.corrupt-sessions')}</Text>
      <Button colorScheme="blackAlpha" onClick={resetAll}>
        {t('Restock.reset-data')}
      </Button>
    </Flex>
  );
};
