import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Spinner,
  Center,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
} from '@chakra-ui/react';
import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import { ItemData, UserList } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import { EffectsCard } from '@components/Hubs/Effects/EffectsCard';

async function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  const res = await axios.get(url, config);
  return res.data;
}

type DynamicListLogsResponse = {
  dynamicLogs: {
    added: number[];
    removed: number[];
    addedAt: string;
  }[];
  item_iids: number[];
};

export type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const DynamicListLogsModal = (props: FeedbackModalProps) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { isOpen, onClose, list } = props;
  const [itemData, setItemData] = useState<{ [iid: number]: ItemData } | null>(null);

  const { data, isLoading: loading } = useSWRImmutable<DynamicListLogsResponse>(
    `/api/v1/lists/${list.official ? 'official' : list.owner.username}/${list.internal_id}/dynamic`,
    fetcher
  );

  useEffect(() => {
    if (data) {
      fetchItemData();
    }
  }, [data]);

  const fetchItemData = async () => {
    if (!data) return;

    const res = await axios.post('/api/v1/items/many', {
      id: data?.item_iids,
    });

    setItemData(res.data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('DynamicList.dynamic-list-history')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!loading && data && (
            <>
              <Accordion allowToggle>
                {data.dynamicLogs.map((logs, i) => (
                  <AccordionItem key={i}>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          {formatter.dateTime(new Date(logs.addedAt), {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: 'America/Los_Angeles',
                          })}{' '}
                          NST
                          <Text fontSize="sm" color="gray.500">
                            {t('General.x-added', { x: logs.added.length })},{' '}
                            {t('General.x-removed', { x: logs.removed.length })}
                          </Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      {!!logs.added.length && (
                        <Flex
                          flexWrap={'wrap'}
                          gap={2}
                          bg={'blackAlpha.400'}
                          p={2}
                          borderRadius={'md'}
                        >
                          <Text fontSize={'sm'} fontWeight="bold">
                            {t('General.added')}
                          </Text>
                          {logs.added.map((iid) => {
                            const item = itemData?.[iid];
                            if (!item) return null;
                            return (
                              <EffectsCard
                                key={item.internal_id}
                                item={item}
                                uniqueID={'dynamic-list-log-add-' + i}
                              />
                            );
                          })}
                        </Flex>
                      )}
                      {!!logs.removed.length && (
                        <Flex
                          flexWrap={'wrap'}
                          gap={2}
                          bg={'blackAlpha.400'}
                          p={2}
                          borderRadius={'md'}
                        >
                          <Text fontSize={'sm'} fontWeight="bold">
                            {t('General.removed')}
                          </Text>
                          {logs.removed.map((iid) => {
                            const item = itemData?.[iid];
                            if (!item) return null;
                            return (
                              <EffectsCard
                                key={item.internal_id}
                                item={item}
                                uniqueID={'dynamic-list-log-add-' + i}
                              />
                            );
                          })}
                        </Flex>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
          {!loading && !data?.item_iids.length && (
            <Text fontSize="sm" textAlign="center" mb={3}>
              {t('DynamicList.no-change-logs-found-for-this-list')}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DynamicListLogsModal;
