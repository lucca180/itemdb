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
import { formatDistance } from 'date-fns';
import { useEffect, useState } from 'react';
import { RestockSession } from '../../types';
import { restockShopInfo } from '../../utils/utils';
import axios from 'axios';
import { useFormatter, useTranslations } from 'next-intl';

export type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refresh: () => void;
};

const ImportRestockModal = (props: FeedbackModalProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { isOpen, onClose, refresh } = props;
  const [allSessions, setSessions] = useState<RestockSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [confirmImport, setConfirmImport] = useState<'import' | 'discard' | null>(null);
  const allChecked = selectedSessions.length === allSessions.length;
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
    } else {
      setSelectedSessions([...selectedSessions, value]);
    }
  };

  const handleImport = async () => {
    const sessions = allSessions.filter((x, i) => selectedSessions.includes(i.toString()));
    await axios.post('/api/v1/restock', { sessionList: sessions });

    if (window && window.itemdb_restock) {
      window.itemdb_restock.cleanAll();
    }

    handleClose();
    refresh();
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
      {confirmImport && (
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

      {!confirmImport && (
        <ModalContent>
          <ModalHeader>{t('Restock.import-sessions')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm">
              {t('Restock.import-modal-4')}
              <br />
              {t('Restock.import-modal-5')}
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
                {t('Restock.import-modal-import-all-x', { x: allSessions.length })}
              </Checkbox>
              <CheckboxGroup colorScheme="green" value={selectedSessions}>
                <Stack pl={3} spacing={3} direction="column">
                  {allSessions.map((session, i) => (
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
              {t('Restock.import-modal-discard-all')}
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => setConfirmImport('import')}
              isDisabled={!selectedSessions.length}
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
