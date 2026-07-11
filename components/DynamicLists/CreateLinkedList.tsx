import { Button, useDisclosure, Text, Box, VStack } from '@chakra-ui/react';
import Dynamic from 'next/dynamic';

import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import { UserList } from '../../types';
import { LinkedListModalProps } from './LinkedListModal';
import { useTranslations } from 'next-intl';

const LinkedListModal = Dynamic<LinkedListModalProps>(() => import('./LinkedListModal'), {
  ssr: false,
});

type CreateLinkedListButtonProps = {
  list: UserList;
  isImport?: boolean;
  onCreate?: (list: UserList) => void;
  isLoading?: boolean;
};

export const CreateLinkedListButton = (props: CreateLinkedListButtonProps) => {
  const t = useTranslations();
  const { open, onOpen, onClose } = useDisclosure();
  const { list, isImport, onCreate, isLoading } = props;

  return (
    <>
      {open && <LinkedListModal isOpen={open} onClose={onClose} list={list} onCreate={onCreate} />}

      <Button
        variant={!isImport ? ['solid', 'ghost'] : 'solid'}
        loading={isLoading}
        textAlign={'center'}
        colorPalette="orange"
        onClick={onOpen}
        data-umami-event="dynamic-list-create"
      >
        <Box display="inline" mr={[0, '5px']}>
          <Image src={DynamicIcon} alt="lightning bolt" width={12} />
        </Box>
        <VStack gap={0} display={!isImport ? ['none', 'inline'] : undefined}>
          <Text>{t('General.create-checklist')}</Text>
          {isImport && <Text fontSize={'xs'}>{list.name}</Text>}
        </VStack>
      </Button>
    </>
  );
};
