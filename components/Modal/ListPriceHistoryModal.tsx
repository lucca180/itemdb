import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ItemPriceData } from '../../types';
import axios from 'axios';
import { isBefore, isSameDay } from 'date-fns';
import { ListChartComponentProps } from '../Charts/ListPriceHistoryChart';
import { ColorInstance } from 'color';
import dynamic from 'next/dynamic';

const ListChartComponent = dynamic<ListChartComponentProps>(
  () => import('../Charts/ListPriceHistoryChart')
);

export type ListPriceHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item_iids: number[];
  listColor: ColorInstance;
};

export const MAX_ITEMS_LIST_PRICE = 500;

export default function ListPriceHistoryModal(props: ListPriceHistoryModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, item_iids, listColor } = props;
  const [pricePerDay, setPricePerDay] = useState<{ [day: string]: number }>({});
  const [idsPerDay, setIdsPerDay] = useState<{ [day: string]: number[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const init = async () => {
    setIsLoading(true);
    const res = await axios.post('/api/v1/prices/history', { item_iids: item_iids });

    const data = res.data as {
      [iid: number]: (ItemPriceData & { item_iid: number; price_id: number })[];
    };

    const perDay: { [day: string]: number } = {};
    const idsPerDay: { [day: string]: number[] } = {};

    Object.keys(data).forEach((iid) => {
      data[Number(iid)].forEach((price) => {
        if (!price.addedAt || !price.value) return;
        const date = price.addedAt.split('T')[0];
        if (!perDay[date]) perDay[date] = 0;
        perDay[date] += price.value;

        if (!idsPerDay[date]) idsPerDay[date] = [];
        idsPerDay[date].push(price.item_iid);

        for (const otherId of Object.keys(data)) {
          if (Number(iid) === Number(otherId) || idsPerDay[date].includes(Number(otherId)))
            continue;

          const otherPrice = data[Number(otherId)].find((p) => {
            if (!p.addedAt || !p.value) return false;

            return (
              isBefore(new Date(p.addedAt), new Date(price.addedAt!)) ||
              isSameDay(new Date(p.addedAt), new Date(price.addedAt!))
            );
          });

          if (!otherPrice) continue;

          perDay[date] += otherPrice.value!;
          idsPerDay[date].push(otherPrice.item_iid);
        }
      });
    });

    setPricePerDay(perDay);
    setIdsPerDay(idsPerDay);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen || !item_iids.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [item_iids, isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Lists.list-price-history')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading && (
              <Center>
                <Spinner />
              </Center>
            )}
            {!isLoading && !!Object.keys(pricePerDay).length && (
              <>
                <ListChartComponent
                  color={listColor}
                  priceData={pricePerDay}
                  noDataData={idsPerDay}
                />
                <Text textAlign={'center'} fontSize="xs" color="gray.400">
                  {t('Lists.graph-warning')}
                </Text>
              </>
            )}
            {!isLoading &&
              Object.keys(pricePerDay).length === 0 &&
              item_iids.length <= MAX_ITEMS_LIST_PRICE && (
                <Text textAlign={'center'} fontSize="sm" color="gray.200" mb={5}>
                  {t('Lists.no-price-history')}
                </Text>
              )}
            {!isLoading &&
              Object.keys(pricePerDay).length === 0 &&
              item_iids.length > MAX_ITEMS_LIST_PRICE && (
                <Text textAlign={'center'} fontSize="sm" color="gray.200" mb={5}>
                  {t('Lists.price-history-max', { MAX_ITEMS: MAX_ITEMS_LIST_PRICE })}
                </Text>
              )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
