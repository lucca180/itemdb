import {
  Text,
  Spinner,
  Center,
  Accordion,
  Box,
  Flex,
  Link,
  Dialog,
  CloseButton,
  Portal,
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

export type DynamicListLogsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const DynamicListLogsModal = (props: DynamicListLogsModalProps) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { isOpen, onClose, list } = props;
  const [itemData, setItemData] = useState<{ [iid: number]: ItemData } | null>(null);

  const { data, isLoading: loading } = useSWRImmutable<DynamicListLogsResponse>(
    `/api/v1/lists/${list.official ? 'official' : list.owner.username}/${list.internal_id}/dynamic`,
    fetcher
  );

  const fetchItemData = async () => {
    if (!data) return;

    const res = await axios.post('/api/v1/items/many', {
      id: data?.item_iids,
    });

    setItemData(res.data);
  };

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchItemData();
    }
  }, [data]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('DynamicList.dynamic-list-history')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Text fontSize="xs" textAlign={'center'} mb={4} color="gray.400">
                {t.rich('Lists.dynamic-disclaimer', {
                  x: list.dynamicType || '',
                  b: (chunk) => <b>{chunk}</b>,
                  Link: (chunk) => (
                    <Link
                      href="/articles/checklists-and-dynamic-lists"
                      target="_blank"
                      rel="noreferrer"
                      color="gray.300"
                    >
                      {chunk}
                    </Link>
                  ),
                })}
              </Text>
              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}
              {!loading && data && (
                <Accordion.Root collapsible>
                  {data.dynamicLogs.map((logs, i) => (
                    <Accordion.Item key={i} value={String(i)}>
                      <Accordion.ItemTrigger>
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
                        <Accordion.ItemIndicator />
                      </Accordion.ItemTrigger>
                      <Accordion.ItemContent>
                        <Accordion.ItemBody pb={4}>
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
                        </Accordion.ItemBody>
                      </Accordion.ItemContent>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              )}
              {!loading && !data?.item_iids.length && (
                <Text fontSize="sm" textAlign="center" mb={3}>
                  {t('DynamicList.no-change-logs-found-for-this-list')}
                </Text>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DynamicListLogsModal;
