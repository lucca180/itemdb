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
import { ExtendedSearchQuery, UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { getRandomName } from '../../utils/randomName';

export type DynamicListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resultCount?: number;
  searchQuery?: ExtendedSearchQuery;
};

const DynamicListModal = (props: DynamicListModalProps) => {
  const toast = useToast();
  const { isOpen, onClose, resultCount, searchQuery } = props;
  const { user, getIdToken } = useAuth();
  const [, setStorageLists] = useAtom(UserLists);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [dynamicType, setDynamicType] = useState<'addOnly' | 'removeOnly' | 'fullSync'>('addOnly');

  const createDynamic = async () => {
    if (!searchQuery || !user) return;

    setLoading(true);
    try {
      const token = await getIdToken();
      const newList = await createNewList();

      const res = await axios.post(
        `/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`,
        {
          dynamicType,
          queryData: searchQuery,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res.data);
      toast({
        title: 'Dynamic List created!',
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
          Dynamic List
        </ModalHeader>
        <ModalCloseButton />
        {!error && !loading && (
          <ModalBody>
            <Text fontSize="sm" color="gray.400">
              Dynamic Lists are special lists that are automatically updated (once per hour) based a
              search query.
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
                <option value="addOnly">Add Only</option>
                <option value="removeOnly">Remove Only</option>
                <option value="fullSync">Full Sync</option>
              </Select>
              <FormHelperText>
                You&apos;ll not be able to change this or the search query later.
              </FormHelperText>
            </FormControl>
            <List spacing={2}>
              <ListItem fontSize={'sm'} color="gray.400">
                <ListIcon as={BsCheckCircleFill} color="green.300" />
                All items ({resultCount}) that match the current search query will be added to the
                list.
              </ListItem>
              {dynamicType === 'addOnly' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    New items that match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be added
                    </Text>{' '}
                    to the list.
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
                    Items that no longer match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="orange.200">
                      won&apos;t be removed
                    </Text>{' '}
                    from the list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You won&apos;t be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      remove items that match
                    </Text>{' '}
                    the search query - <i>but you can hide them</i>.
                  </ListItem>
                </>
              )}
              {dynamicType === 'removeOnly' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsExclamationCircleFill} color="orange.300" />
                    New items that match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="orange.200">
                      won&apos;t be added
                    </Text>{' '}
                    to the list.
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
                    Items that no longer match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be removed
                    </Text>{' '}
                    from the list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    You will be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      remove items
                    </Text>{' '}
                    from the list.
                  </ListItem>
                </>
              )}
              {dynamicType === 'fullSync' && (
                <>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsCheckCircleFill} color="green.300" />
                    New items that match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be added
                    </Text>{' '}
                    to the list.
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
                    Items that no longer match the search query{' '}
                    <Text fontWeight={'bold'} as="b" color="green.200">
                      will be removed
                    </Text>{' '}
                    from the list.
                  </ListItem>
                  <ListItem fontSize={'sm'} color="gray.400">
                    <ListIcon as={BsXCircleFill} color="red.300" />
                    You&apos;ll not be able to{' '}
                    <Text fontWeight={'bold'} as="b" color="red.200">
                      remove items
                    </Text>{' '}
                    from the list - <i>but you can hide them</i>.
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
              isDisabled={!!resultCount && resultCount > 3000}
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

export default DynamicListModal;
