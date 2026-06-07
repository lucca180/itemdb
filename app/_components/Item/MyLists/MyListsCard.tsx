'use client';

import {
  Flex,
  Link,
  Tag,
  Text,
  List,
  IconButton,
  Menu,
  Portal,
  HStack,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import React, { useEffect, useState } from 'react';
import { useRouter } from '@i18n/navigation';
import CardBase from '@components/Card/CardBase';
import MainLink from '@components/Utils/MainLink';
import Image from 'next/image';
import DynamicIcon from '@assets/icons/dynamic.png';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Color from 'color';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { isDynamicActionDisabled } from '@utils/utils';
import type { DuplicatedItemModalProps } from '@components/Modal/DuplicatedItemModal';
import type { ItemActionModalProps } from '@components/Modal/ItemActionModal';
import type { ItemData, ObligatoryUserList } from '@types';

const Markdown = dynamic(() => import('@components/Utils/Markdown'));

const ItemActionModal = dynamic<ItemActionModalProps>(
  () => import('@components/Modal/ItemActionModal')
);
const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('@components/Modal/DuplicatedItemModal')
);

type Props = {
  item: ItemData;
  labels: {
    title: string;
    changesSaved: string;
    somethingWentWrong: string;
    tryAgainLater: string;
    saving: string;
    hidden: string;
    highlight: string;
    listNoDescription: string;
    markAsHidden: string;
    unmarkAsHidden: string;
    markAsHighlight: string;
    unmarkAsHighlight: string;
    changeQuantity: string;
    deleteFromList: string;
  };
  lists: ObligatoryUserList[];
};

export function MyListsCard({ item, labels, lists: serverLists }: Props) {
  const router = useRouter();
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const { open: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();

  const [lists, setLists] = useState(serverLists);
  const [selectedList, setSelectedList] = useState<ObligatoryUserList | undefined>();

  useEffect(() => {
    setLists(serverLists);
  }, [serverLists]);

  const color = Color(item.color.hex);
  const toast = useToast();

  const refreshLists = () => router.refresh();

  const doAction = async (list: ObligatoryUserList, action: 'hide' | 'highlight') => {
    const itemInfo = list.itemInfo[0];
    const nextItemInfo = {
      ...itemInfo,
      isHidden: action === 'hide' ? !itemInfo.isHidden : itemInfo.isHidden,
      isHighlight: action === 'highlight' ? !itemInfo.isHighlight : itemInfo.isHighlight,
    };

    const promise = axios
      .post(`/api/v1/lists/${list.owner.username}/${list.internal_id}`, {
        list_id: list.internal_id,
        itemInfo: [nextItemInfo],
      })
      .then(() => {
        setLists((prev) =>
          prev.map((entry) =>
            entry.internal_id === list.internal_id ? { ...entry, itemInfo: [nextItemInfo] } : entry
          )
        );
      });

    toast.promise(promise, {
      success: { id: 'my-lists-action-success', title: labels.changesSaved },
      error: {
        id: 'my-lists-action-error',
        title: labels.somethingWentWrong,
        description: labels.tryAgainLater,
      },
      loading: { id: 'my-lists-action-loading', title: `${labels.saving}...` },
    });
  };

  const handleOpen = (list: ObligatoryUserList) => {
    setSelectedList(list);
    onOpen();
  };

  const handleActionOpen = (list: ObligatoryUserList) => {
    setSelectedList(list);
    onActionOpen();
  };

  if (!lists.length) return null;

  return (
    <>
      {isOpen && selectedList && (
        <DuplicatedItemModal
          isOpen={isOpen}
          onClose={onClose}
          item={item}
          list={selectedList}
          onChange={refreshLists}
          itemInfo={selectedList.itemInfo[0]}
        />
      )}

      {isActionOpen && selectedList && (
        <ItemActionModal
          refresh={refreshLists}
          isOpen={isActionOpen}
          onClose={onActionClose}
          selectedItems={[selectedList.itemInfo[0]]}
          action={'delete'}
          list={selectedList}
        />
      )}
      <CardBase title={labels.title} color={item.color.rgb}>
        <Flex gap={3} flexFlow="column">
          <List.Root gap={3}>
            {lists.map((list, i) => (
              <List.Item key={i}>
                <Flex alignItems={'center'} gap={2}>
                  <Link asChild whiteSpace="nowrap">
                    <MainLink
                      href={`/lists/${list.owner.username}/${list.slug ?? list.internal_id}`}
                    >
                      <Tag.Root
                        variant="subtle"
                        size="lg"
                        fontWeight="bold"
                        verticalAlign="middle"
                        display={'inline-flex'}
                        alignItems="center"
                        colorPalette="whiteAlpha"
                      >
                        <Tag.Label>
                          {list.name}
                          {list.dynamicType && (
                            <Image
                              src={DynamicIcon}
                              alt="dynamic list"
                              width={10}
                              style={{ marginLeft: '5px' }}
                            />
                          )}
                        </Tag.Label>
                      </Tag.Root>
                    </MainLink>
                  </Link>
                  <Flex flex="1" flexFlow={'row'} gap={1}>
                    <HStack gap={1}>
                      <Badge fontSize={'0.7rem'} textTransform={'none'}>
                        {list.itemInfo[0].amount}x
                      </Badge>
                      {list.itemInfo[0].isHidden && (
                        <Badge fontSize={'0.7rem'}>{labels.hidden}</Badge>
                      )}
                      {list.itemInfo[0].isHighlight && (
                        <Badge fontSize={'0.7rem'} colorPalette="orange">
                          {labels.highlight}
                        </Badge>
                      )}
                    </HStack>
                    <Text
                      display="inline"
                      verticalAlign="middle"
                      fontSize={'xs'}
                      as="div"
                      css={{
                        '& p': { display: 'inline' },
                        '& a': { color: color.lightness(70).hex() },
                      }}
                    >
                      -{' '}
                      <Markdown>
                        {(list.description || labels.listNoDescription).split(/[\r\n]+/)[0]}
                      </Markdown>
                    </Text>
                  </Flex>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <IconButton aria-label="Options" size="sm" variant="solid">
                        <BsThreeDotsVertical />
                      </IconButton>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            value="hide"
                            fontSize={'sm'}
                            onClick={() => doAction(list, 'hide')}
                          >
                            {list.itemInfo[0].isHidden
                              ? labels.unmarkAsHidden
                              : labels.markAsHidden}
                          </Menu.Item>
                          <Menu.Item
                            value="highlight"
                            fontSize={'sm'}
                            onClick={() => doAction(list, 'highlight')}
                          >
                            {list.itemInfo[0].isHighlight
                              ? labels.unmarkAsHighlight
                              : labels.markAsHighlight}
                          </Menu.Item>
                          <Menu.Item
                            value="quantity"
                            onClick={() => handleOpen(list)}
                            fontSize={'sm'}
                          >
                            {labels.changeQuantity}
                          </Menu.Item>
                          <Menu.Item
                            value="delete"
                            onClick={() => handleActionOpen(list)}
                            fontSize={'sm'}
                            color="red.300"
                            disabled={isDynamicActionDisabled('remove', list.dynamicType)}
                          >
                            {labels.deleteFromList}
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </Flex>
              </List.Item>
            ))}
          </List.Root>
        </Flex>
      </CardBase>
    </>
  );
}
