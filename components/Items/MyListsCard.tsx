import {
  Flex,
  Link,
  Tag,
  Text,
  List,
  ListItem,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  HStack,
  Badge,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { ItemData, ReducedUserList } from '../../types';
import CardBase from '../Card/CardBase';
import NextLink from 'next/link';
import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Color from 'color';
import useSWR from 'swr';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { isDynamicActionDisabled } from '../../utils/utils';
import { DuplicatedItemModalProps } from '../Modal/DuplicatedItemModal';
import { ItemActionModalProps } from '../Modal/ItemActionModal';

const Markdown = dynamic(() => import('../Utils/Markdown'), { ssr: false });

const ItemActionModal = dynamic<ItemActionModalProps>(() => import('../Modal/ItemActionModal'));
const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('../Modal/DuplicatedItemModal')
);

const fetcher = (url: string) => axios.get(url).then((res) => res.data as ReducedUserList[]);

type Props = {
  item: ItemData;
};

const ItemMyLists = (props: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();

  const [selectedList, setSelectedList] = React.useState<ReducedUserList | undefined>();
  const { item } = props;
  const { data, mutate } = useSWR(`/api/v1/items/${item.internal_id}/mylists`, fetcher, {
    shouldRetryOnError: false,
  });

  const lists = useMemo(() => data?.filter((list) => !list.official), [data]);

  const color = Color(item.color.hex);
  const toast = useToast();

  const doAction = async (list: ReducedUserList, action: 'hide' | 'highlight') => {
    const promise = axios
      .post(`/api/v1/lists/${list.owner.username}/${list.internal_id}`, {
        list_id: list.internal_id,
        itemInfo: [
          {
            ...list.itemInfo[0],
            isHidden: action === 'hide' ? !list.itemInfo[0].isHidden : list.itemInfo[0].isHidden,
            isHighlight:
              action === 'highlight' ? !list.itemInfo[0].isHighlight : list.itemInfo[0].isHighlight,
          },
        ],
      })
      .then(() => mutate());

    toast.promise(promise, {
      success: { title: 'Changes Saved!' },
      error: { title: 'Something went wrong', description: 'Please try again later' },
      loading: { title: 'Saving...' },
    });
  };

  const handleOpen = (list: ReducedUserList) => {
    setSelectedList(list);
    onOpen();
  };

  const handleActionOpen = (list: ReducedUserList) => {
    setSelectedList(list);
    onActionOpen();
  };

  if (!lists || !lists.length) return null;

  return (
    <>
      {isOpen && selectedList && (
        <DuplicatedItemModal
          isOpen={isOpen}
          onClose={onClose}
          item={item}
          list={selectedList}
          onChange={() => mutate()}
          itemInfo={selectedList.itemInfo[0]}
        />
      )}

      {isActionOpen && selectedList && (
        <ItemActionModal
          refresh={() => mutate()}
          isOpen={isActionOpen}
          onClose={onActionClose}
          selectedItems={[selectedList.itemInfo[0]]}
          action={'delete'}
          list={selectedList}
        />
      )}
      <CardBase title="My Lists" color={item.color.rgb}>
        <Flex gap={3} flexFlow="column">
          <List spacing={3}>
            {lists.map((list, i) => (
              <ListItem key={i}>
                <Flex alignItems={'center'} gap={2}>
                  <Link
                    as={NextLink}
                    href={`/lists/${list.owner.username}/${list.internal_id}`}
                    whiteSpace="nowrap"
                  >
                    <Tag
                      variant="subtle"
                      size="lg"
                      fontWeight="bold"
                      verticalAlign="middle"
                      display={'inline-flex'}
                      alignItems="center"
                    >
                      {list.name}
                      {list.dynamicType && (
                        <Image
                          src={DynamicIcon}
                          alt="dynamic list"
                          width={10}
                          style={{ marginLeft: '5px' }}
                        />
                      )}
                    </Tag>
                  </Link>
                  <Flex flex="1" flexFlow={'row'} gap={1}>
                    <HStack spacing={1}>
                      <Badge fontSize={'0.7rem'} textTransform={'none'}>
                        {list.itemInfo[0].amount}x
                      </Badge>
                      {list.itemInfo[0].isHidden && <Badge fontSize={'0.7rem'}>Hidden</Badge>}
                      {list.itemInfo[0].isHighlight && (
                        <Badge fontSize={'0.7rem'} colorScheme="orange">
                          Highlight
                        </Badge>
                      )}
                    </HStack>
                    <Text
                      display="inline"
                      verticalAlign="middle"
                      fontSize={'xs'}
                      sx={{ p: { display: 'inline' }, a: { color: color.lightness(70).hex() } }}
                    >
                      -{' '}
                      <Markdown>
                        {
                          (list.description || "This list doesn't have a description yet").split(
                            /[\r\n]+/
                          )[0]
                        }
                      </Markdown>
                    </Text>
                  </Flex>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<BsThreeDotsVertical />}
                      size="sm"
                      variant="solid"
                    />
                    <MenuList>
                      <MenuItem fontSize={'sm'} onClick={() => doAction(list, 'hide')}>
                        {list.itemInfo[0].isHidden ? 'Unmark as Hidden' : 'Mark as Hidden'}
                      </MenuItem>
                      <MenuItem fontSize={'sm'} onClick={() => doAction(list, 'highlight')}>
                        {list.itemInfo[0].isHighlight ? 'Unmark as Highlight' : 'Mark as Highlight'}
                      </MenuItem>
                      <MenuItem onClick={() => handleOpen(list)} fontSize={'sm'}>
                        Change Quantity
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleActionOpen(list)}
                        fontSize={'sm'}
                        color="red.300"
                        isDisabled={isDynamicActionDisabled('remove', list.dynamicType)}
                      >
                        Delete from list
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Flex>
      </CardBase>
    </>
  );
};

export default ItemMyLists;
