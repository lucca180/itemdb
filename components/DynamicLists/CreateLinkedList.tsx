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
  /** The list can back a Goal Counter */
  showGoalStep?: boolean;
  /** Small "create another" link, for when the user already follows the list */
  compact?: boolean;
};

export const CreateLinkedListButton = (props: CreateLinkedListButtonProps) => {
  const t = useTranslations();
  const { open, onOpen, onClose } = useDisclosure();
  const { list, isImport, onCreate, isLoading, showGoalStep, compact } = props;

  return (
    <>
      {open && (
        <LinkedListModal
          isOpen={open}
          onClose={onClose}
          list={list}
          onCreate={onCreate}
          showGoalStep={showGoalStep}
        />
      )}

      {compact ? (
        <Button
          size="xs"
          variant="ghost"
          colorPalette="orange"
          alignSelf="flex-start"
          onClick={onOpen}
          data-umami-event="dynamic-list-create"
          data-umami-event-from="linked-another"
        >
          <Image src={DynamicIcon} alt="" width={9} />
          {t('DynamicList.create-another-checklist')}
        </Button>
      ) : (
        <Button
          variant={!isImport ? ['solid', 'ghost'] : 'solid'}
          loading={isLoading}
          textAlign={'center'}
          colorPalette="orange"
          onClick={onOpen}
          data-umami-event="dynamic-list-create"
          data-umami-event-from="linked"
        >
          <Box display="inline" mr={[0, '5px']}>
            <Image src={DynamicIcon} alt="lightning bolt" width={12} />
          </Box>
          <VStack gap={0} display={!isImport ? ['none', 'inline'] : undefined}>
            <Text>{t('General.create-checklist')}</Text>
            {isImport && <Text fontSize={'xs'}>{list.name}</Text>}
          </VStack>
        </Button>
      )}
    </>
  );
};
