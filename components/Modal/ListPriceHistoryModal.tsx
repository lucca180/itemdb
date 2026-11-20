import { Text, Center, Spinner, Dialog, CloseButton, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ListChartComponentProps } from '@components/Charts/ListPriceHistoryChart';
import { ColorInstance } from 'color';
import dynamic from 'next/dynamic';
import { loadListPriceHistory } from '@app/server/lists/actions';
import type { ListPriceHistoryResult } from '@utils/list/listPriceHistory';

const ListChartComponent = dynamic<ListChartComponentProps>(
  () => import('@components/Charts/ListPriceHistoryChart')
);

export type ListPriceHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** `'official'` for official lists */
  username: string;
  listId: number;
  listColor: ColorInstance;
};

type LoadState =
  { status: 'loading' } | { status: 'error' } | { status: 'done'; result: ListPriceHistoryResult };

export default function ListPriceHistoryModal(props: ListPriceHistoryModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, username, listId, listColor } = props;
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    loadListPriceHistory(username, listId)
      .then((result) => {
        if (!cancelled) setState({ status: 'done', result });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, username, listId]);

  const result = state.status === 'done' ? state.result : null;
  const points = result?.status === 'ok' ? result.points : [];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Lists.list-price-history')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {state.status === 'loading' && (
                <Center>
                  <Spinner />
                </Center>
              )}
              {state.status === 'error' && (
                <Text textAlign={'center'} fontSize="sm" color="gray.200" mb={5}>
                  {t('General.something-went-wrong')}
                </Text>
              )}
              {points.length > 0 && (
                <>
                  <ListChartComponent color={listColor} priceData={points} />
                  <Text textAlign={'center'} fontSize="xs" color="gray.400">
                    {t('Lists.graph-warning')}
                  </Text>
                </>
              )}
              {result?.status === 'ok' && points.length === 0 && (
                <Text textAlign={'center'} fontSize="sm" color="gray.200" mb={5}>
                  {t('Lists.no-price-history')}
                </Text>
              )}
              {result?.status === 'too-many' && (
                <Text textAlign={'center'} fontSize="sm" color="gray.200" mb={5}>
                  {t('Lists.price-history-max', { MAX_ITEMS: result.max })}
                </Text>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
