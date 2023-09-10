/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, useDisclosure } from '@chakra-ui/react';
import { DynamicListModalProps } from './DynamicListModal';
import Dynamic from 'next/dynamic';

import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import { SearchFilters } from '../../types';

const DynamicListModal = Dynamic<DynamicListModalProps>(() => import('./DynamicListModal'));

type CreateDynamicListButtonProps = {
  resultCount?: number;
  isLoading?: boolean;
  filters?: SearchFilters;
  query?: string;
  isMobile?: boolean;
};

export const CreateDynamicListButton = (props: CreateDynamicListButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { resultCount, isLoading, filters, query, isMobile } = props;

  return (
    <>
      {isOpen && (
        <DynamicListModal
          isOpen={isOpen}
          onClose={onClose}
          resultCount={resultCount}
          searchQuery={{ ...filters!, s: query ?? '' }}
        />
      )}
      {!isMobile && (
        <Button
          variant="ghost"
          textAlign={'center'}
          colorScheme="orange"
          size="sm"
          onClick={onOpen}
          isLoading={isLoading}
          mt={3}
        >
          Create{' '}
          <Image src={DynamicIcon} alt="lightning bolt" width={12} style={{ margin: '0 5px' }} />{' '}
          Dynamic List
        </Button>
      )}
      {isMobile && (
        <Button
          variant="solid"
          // textAlign={'center'}
          colorScheme="orange"
          size="sm"
          onClick={onOpen}
          isLoading={isLoading}
          h={10}
          minW={10}
          // mt={3}
        >
          <Image src={DynamicIcon} alt="lightning bolt" width={12} />
        </Button>
      )}
    </>
  );
};
