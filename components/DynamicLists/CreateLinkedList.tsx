/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, useDisclosure, Text } from '@chakra-ui/react';
import Dynamic from 'next/dynamic';

import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import { UserList } from '../../types';
import { LinkedListModalProps } from './LinkedListModal';

const LinkedListModal = Dynamic<LinkedListModalProps>(() => import('./LinkedListModal'));

type CreateLinkedListButtonProps = {
  list: UserList;
};

export const CreateLinkedListButton = (props: CreateLinkedListButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { list } = props;

  return (
    <>
      {isOpen && <LinkedListModal isOpen={isOpen} onClose={onClose} list={list} />}

      <Button
        variant={['solid', 'ghost']}
        textAlign={'center'}
        colorScheme="orange"
        onClick={onOpen}
      >
        <Image src={DynamicIcon} alt="lightning bolt" width={12} style={{ marginRight: '5px' }} />{' '}
        <Text display={['none', 'inline']}>Create Checklist</Text>
      </Button>
    </>
  );
};
