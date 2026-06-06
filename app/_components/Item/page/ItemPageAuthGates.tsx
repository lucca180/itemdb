'use client';

import { Button, Flex, Icon } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { FiEdit3 } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useAuth } from '@utils/auth';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import type { EditItemModalProps } from '@components/Modal/EditItemModal';
import type { ItemPageData } from '@app/utils/loadItemPage';
import type { ItemOpenable } from '@types';

const EditItemModal = dynamic<EditItemModalProps>(() => import('@components/Modal/EditItemModal'));

type ItemPageEditSectionProps = Pick<ItemPageData, 'item' | 'itemEffects' | 'petpetData'> & {
  labels: {
    reportError: string;
    edit: string;
  };
};

async function fetchItemOpenable(slug: string): Promise<ItemOpenable | null> {
  const { data } = await axios.get<{ drops: ItemOpenable | null }>(`/api/v1/items/${slug}/drops`);
  return data.drops ?? null;
}

export function ItemPageEditSection(props: ItemPageEditSectionProps) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemOpenable, setItemOpenable] = useState<ItemOpenable | null>(null);
  const [isItemOpenableLoading, setIsItemOpenableLoading] = useState(false);
  const { item, itemEffects, petpetData, labels } = props;

  const handleOpenEdit = () => {
    setIsEditModalOpen(true);

    if (item.useTypes.canOpen === 'false' || !item.slug) {
      setItemOpenable(null);
      setIsItemOpenableLoading(false);
      return;
    }

    setItemOpenable(null);
    setIsItemOpenableLoading(true);
    fetchItemOpenable(item.slug)
      .then((openable) => setItemOpenable(openable))
      .finally(() => setIsItemOpenableLoading(false));
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setItemOpenable(null);
    setIsItemOpenableLoading(false);
  };

  return (
    <>
      {item && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          itemOpenable={itemOpenable}
          isItemOpenableLoading={isItemOpenableLoading}
          itemEffects={itemEffects}
          petpetData={petpetData}
          item={item}
          onClose={handleCloseEdit}
          tags={[]}
        />
      )}
      <Flex justifyContent="center" gap={1}>
        <FeedbackButton colorPalette="red" variant="ghost">
          {labels.reportError}
        </FeedbackButton>
        {user?.isAdmin && (
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Icon as={FiEdit3} mr={1} /> {labels.edit}
          </Button>
        )}
      </Flex>
    </>
  );
}

export function ItemPageAdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isAdmin) return null;
  return children;
}

export function ItemPageUserOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return children;
}
