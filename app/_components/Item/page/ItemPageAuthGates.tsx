'use client';

import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { FiEdit3, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useAuth } from '@utils/auth';
import { itemRootTag } from '@utils/appCacheTags';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import type { EditItemModalProps } from '@components/Modal/EditItemModal';
import type { ItemData, ItemEffect, ItemOpenable, ItemPetpetData } from '@types';

const EditItemModal = dynamic<EditItemModalProps>(() => import('@components/Modal/EditItemModal'));

type ItemPageEditSectionProps = {
  item: ItemData;
  itemEffects: ItemEffect[];
  labels: {
    reportError: string;
    edit: string;
  };
};

async function fetchItemOpenable(slug: string): Promise<ItemOpenable | null> {
  const { data } = await axios.get<{ drops: ItemOpenable | null }>(`/api/v1/items/${slug}/drops`);
  return data.drops ?? null;
}

async function fetchPetpetData(slug: string): Promise<ItemPetpetData | null> {
  const { data } = await axios.get<ItemPetpetData | null>(`/api/v1/items/${slug}/petpet`);
  return data ?? null;
}

function shouldFetchPetpetData(item: ItemData) {
  return !item.isNC && !item.isWearable && !item.isBD && !item.isNeohome;
}

export function ItemPageEditSection(props: ItemPageEditSectionProps) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(null);
  const [isItemOpenableLoading, setIsItemOpenableLoading] = useState(false);
  const [itemOpenableLoadError, setItemOpenableLoadError] = useState(false);
  const [petpetData, setPetpetData] = useState<ItemPetpetData | null>(null);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [cacheRefreshError, setCacheRefreshError] = useState(false);
  const { item, itemEffects, labels } = props;

  const loadItemOpenableForEdit = (slug: string) => {
    setItemOpenableLoadError(false);
    setItemOpenable(null);
    setIsItemOpenableLoading(true);
    fetchItemOpenable(slug)
      .then((openable) => setItemOpenable(openable))
      .catch(() => setItemOpenableLoadError(true))
      .finally(() => setIsItemOpenableLoading(false));
  };

  const handleOpenEdit = () => {
    setIsEditModalOpen(true);

    if (item.useTypes.canOpen === 'false' || !item.slug) {
      setItemOpenable(null);
      setItemOpenableLoadError(false);
      setIsItemOpenableLoading(false);
    } else {
      loadItemOpenableForEdit(item.slug);
    }

    if (item.slug && shouldFetchPetpetData(item)) {
      fetchPetpetData(item.slug)
        .then(setPetpetData)
        .catch(() => setPetpetData(null));
    } else {
      setPetpetData(null);
    }
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setItemOpenable(null);
    setItemOpenableLoadError(false);
    setIsItemOpenableLoading(false);
    setPetpetData(null);
  };

  const handleRefreshCache = async () => {
    setIsRefreshingCache(true);
    setCacheRefreshError(false);
    try {
      await axios.post('/api/internal/revalidate', {
        tags: [itemRootTag(item.internal_id)],
        context: { internalId: item.internal_id },
      });
      window.location.reload();
    } catch {
      setCacheRefreshError(true);
      setIsRefreshingCache(false);
    }
  };

  return (
    <>
      {item && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          itemOpenable={itemOpenable}
          isItemOpenableLoading={isItemOpenableLoading}
          itemOpenableLoadError={itemOpenableLoadError}
          onRetryItemOpenable={item.slug ? () => loadItemOpenableForEdit(item.slug!) : undefined}
          itemEffects={itemEffects}
          petpetData={petpetData}
          item={item}
          onClose={handleCloseEdit}
          tags={[]}
        />
      )}
      <Flex justifyContent="center" gap={1} flexWrap="wrap">
        <FeedbackButton colorPalette="red" variant="ghost">
          {labels.reportError}
        </FeedbackButton>
        {user?.isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              loading={isRefreshingCache}
              onClick={handleRefreshCache}
            >
              <Icon as={FiRefreshCw} mr={1} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenEdit}>
              <Icon as={FiEdit3} mr={1} /> {labels.edit}
            </Button>
          </>
        )}
        {cacheRefreshError && (
          <Text fontSize="xs" color="red.300" w="100%" textAlign="center">
            Cache refresh failed
          </Text>
        )}
      </Flex>
    </>
  );
}
