import { Button, useDisclosure } from '@chakra-ui/react';
import { DynamicListModalProps } from './DynamicListModal';
import Dynamic from 'next/dynamic';

import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import { SearchFilters } from '../../types';
import { useTranslations } from 'next-intl';

const DynamicListModal = Dynamic<DynamicListModalProps>(() => import('./DynamicListModal'));

type CreateDynamicListButtonProps = {
  resultCount?: number;
  isLoading?: boolean;
  filters?: SearchFilters;
  query?: string;
  isMobile?: boolean;
  removeMargin?: boolean;
};

export const CreateDynamicListButton = (props: CreateDynamicListButtonProps) => {
  const t = useTranslations();
  const { open, onOpen, onClose } = useDisclosure();
  const { resultCount, isLoading, filters, query, isMobile, removeMargin } = props;

  // you cannot create a dynamic list from a list search
  if (filters?.list_id) return null;

  return (
    <>
      {open && (
        <DynamicListModal
          isOpen={open}
          onClose={onClose}
          resultCount={resultCount}
          searchQuery={{ ...filters!, s: query ?? '' }}
        />
      )}
      {!isMobile && (
        <Button
          variant="ghost"
          textAlign={'center'}
          colorPalette="orange"
          size="sm"
          onClick={onOpen}
          loading={isLoading}
          mt={removeMargin ? undefined : 3}
          data-umami-event="dynamic-list-create"
        >
          {t('General.create')}{' '}
          <Image src={DynamicIcon} alt="lightning bolt" width={12} style={{ margin: '0 5px' }} />{' '}
          {t('General.dynamic-list')}
        </Button>
      )}
      {isMobile && (
        <Button
          variant="solid"
          // textAlign={'center'}
          colorPalette="orange"
          size="sm"
          onClick={onOpen}
          loading={isLoading}
          h={10}
          minW={10}
          // mt={3}
          data-umami-event="dynamic-list-create"
        >
          <Image src={DynamicIcon} alt="lightning bolt" width={12} />
        </Button>
      )}
    </>
  );
};
