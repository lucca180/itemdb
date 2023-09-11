import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Select,
  FormControl,
  FormLabel,
  List,
  ListIcon,
  ListItem,
  FormHelperText,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAtom } from 'jotai';

import Image from 'next/image';
import { useState } from 'react';
import { BsCheckCircleFill, BsExclamationCircleFill, BsXCircleFill } from 'react-icons/bs';
import DynamicIcon from '../../public/icons/dynamic.png';
import { UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { getRandomName } from '../../utils/randomName';

export type LinkedListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
};

const LinkedListModal = (props: LinkedListModalProps) => {
  const toast = useToast();
  const { isOpen, onClose, list } = props;
  const { user, getIdToken } = useAuth();
  const [, setStorageLists] = useAtom(UserLists);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [dynamicType, setDynamicType] = useState<'addOnly' | 'removeOnly' | 'fullSync'>('fullSync');

  const createDynamic = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await getIdToken();
      const newList = await createNewList();

      await axios.post(
        `/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`,
        {
          dynamicType,
          linked_id: list.internal_id,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Linked List created!',
        status: 'success',
        duration: 5000,
      });
      onClose();
    } catch (e) {
      console.log(e);
      setError(true);
    }
  };

  const createNewList = async () => {
    if (!user) throw new Error('User not found');
    const token = await getIdToken();

    const res = await axios.post(
      `/api/v1/lists/${user.username}`,
      {
        name: getRandomName(),
        description: '',
        cover_url: '',
        visibility: 'public',
        purpose: 'none',
        colorHex: '#fff',
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
      const list = res.data.message;
      setStorageLists(null);
      return list as UserList;
    } else throw new Error(res.data.message);
  };

  const doClose = () => {
    if (loading) return false;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={doClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader display={'flex'} alignItems="center">
          Create{' '}
          <Image
            src={DynamicIcon}
            alt="lightning bolt"
            width={16}
            style={{ margin: '0 5px', display: 'inline' }}
          />{' '}
          Linked List
        </ModalHeader>
        <ModalCloseButton />
        {!error && !loading && (
          <ModalBody>
            <Text fontSize="sm" color="gray.400">
              Linked Lists are special lists that are automatically updated based on another list.
            </Text>
            <Alert size="sm" status="warning" mt={5} borderRadius={'md'}>
              <AlertIcon />
              Dynamic Lists are limited to 3.000 items
            </Alert>

            <FormControl my={5}>
              <FormLabel>Dynamic Type</FormLabel>
              <Select
                value={dynamicType}
                variant="solid"
                bg={'blackAlpha.300'}
                onChange={(e) =>
                  setDynamicType(e.target.value as 'addOnly' | 'removeOnly' | 'fullSync')
                }
              >
                <option value="fullSync">Full Sync</option>
                <option value="addOnly">Add Only</option>
                <option value="removeOnly">Remove Only</option>
              </Select>
              <FormHelperText>You&apos;ll not be able to change this later.</FormHelperText>
            </FormControl>
            <List spacing={2}>
              <ListItem fontSize={'sm'} color="gray.400">
                <ListIcon as={BsCheckCircleFill} color="green.300" />
                All items ({list.itemCount}) from the current list will be added to the new list.
              </ListItem>
              {dynamicType === 'addOnly' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    New items added to the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be added
                    </Text>{' '}
                    to the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    You&apos;ll be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      add new items
                    </Text>{' '}
                    to the list manually.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsExclamationCircleFill} color="orange.300" />
                    Items that are no longer on the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="orange.200">
                      won&apos;t be removed
                    </Text>{' '}
                    from the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You won&apos;t be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      remove items
                    </Text>{' '}
                    from the new list that are on the original list - <i>but you can hide them</i>.
                  </ListItem>
                </>
              )}
              {dynamicType === 'removeOnly' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsExclamationCircleFill} color="orange.300" />
                    New items added to the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="orange.200">
                      won&apos;t be added
                    </Text>{' '}
                    to the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You&apos;ll not be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      add new items
                    </Text>{' '}
                    to the list manually.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    Items that are no longer on the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be removed
                    </Text>{' '}
                    from the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    You will be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      remove items
                    </Text>{' '}
                    from the new list.
                  </ListItem>
                </>
              )}
              {dynamicType === 'fullSync' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    New items added to the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be added
                    </Text>{' '}
                    to the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You&apos;ll not be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      add new items
                    </Text>{' '}
                    to the new list manually.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    Items that are no longer on the original list{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be removed
                    </Text>{' '}
                    from the new list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You&apos;ll not be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      remove items
                    </Text>{' '}
                    from the new list - <i>but you can hide them</i>.
                  </ListItem>
                </>
              )}
            </List>
          </ModalBody>
        )}

        {error && (
          <ModalBody>
            <Text color="red.300" textAlign={'center'}>
              Something went wrong
              <br />
              Please refresh the page and try again later.
            </Text>
          </ModalBody>
        )}

        {loading && !error && (
          <ModalBody>
            <Center>
              <Spinner />
            </Center>
          </ModalBody>
        )}

        <ModalFooter>
          {!loading && (
            <Button variant="ghost" mr={3} onClick={doClose}>
              Close
            </Button>
          )}
          {!error && !loading && (
            <Button
              variant="ghost"
              colorScheme={'orange'}
              onClick={createDynamic}
              isDisabled={list.itemCount > 3000}
            >
              <Image
                src={DynamicIcon}
                alt="lightning bolt"
                width={12}
                style={{ margin: '0 5px', display: 'inline' }}
              />{' '}
              Create
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LinkedListModal;
