'use client';

import { Button, Flex, Icon } from '@chakra-ui/react';
import { useState } from 'react';
import { FiEdit3 } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import type { EditItemModalProps } from '@components/Modal/EditItemModal';
import type { ItemPageData } from '@app/utils/itemPage';

const EditItemModal = dynamic<EditItemModalProps>(() => import('@components/Modal/EditItemModal'));

type ItemPageEditSectionProps = Pick<
  ItemPageData,
  'item' | 'itemOpenable' | 'itemEffects' | 'petpetData'
>;

export function ItemPageEditSection(props: ItemPageEditSectionProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { item, itemOpenable, itemEffects, petpetData } = props;

  return (
    <>
      {item && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          itemOpenable={itemOpenable}
          itemEffects={itemEffects}
          petpetData={petpetData}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          tags={[]}
        />
      )}
      <Flex justifyContent="center" gap={1}>
        <FeedbackButton colorPalette="red" variant="ghost">
          {t('ItemPage.report-error')}
        </FeedbackButton>
        {user?.isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Icon as={FiEdit3} mr={1} /> {t('Button.edit')}
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
