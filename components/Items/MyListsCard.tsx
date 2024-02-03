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
import { useTranslations } from 'next-intl';

const Markdown = dynamic(() => import('../Utils/Markdown'));

const ItemActionModal = dynamic<ItemActionModalProps>(() => import('../Modal/ItemActionModal'));
const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('../Modal/DuplicatedItemModal')
);

const fetcher = (url: string) => axios.get(url).then((res) => res.data as ReducedUserList[]);

type Props = {
  item: ItemData;
};

const ItemMyLists = (props: Props) => {
  const t = useTranslations();
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
      success: { title: t('General.changes-saved') },
      error: {
        title: t('General.something-went-wrong'),
        description: t('General.try-again-later'),
      },
      loading: { title: `${t('General.saving')}...` },
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
      <CardBase title={t('Layout.my-lists')} color={item.color.rgb}>
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
                      {list.itemInfo[0].isHidden && (
                        <Badge fontSize={'0.7rem'}>{t('Lists.hidden')}</Badge>
                      )}
                      {list.itemInfo[0].isHighlight && (
                        <Badge fontSize={'0.7rem'} colorScheme="orange">
                          {t('Lists.highlight')}
                        </Badge>
                      )}
                    </HStack>
                    <Text
                      display="inline"
                      verticalAlign="middle"
                      fontSize={'xs'}
                      as="div"
                      sx={{ p: { display: 'inline' }, a: { color: color.lightness(70).hex() } }}
                    >
                      -{' '}
                      <Markdown>
                        {
                          (list.description || t('ItemPage.list-no-description')).split(
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
                        {list.itemInfo[0].isHidden
                          ? t('ItemPage.unmark-as-hidden')
                          : t('ItemPage.mark-as-hidden')}
                      </MenuItem>
                      <MenuItem fontSize={'sm'} onClick={() => doAction(list, 'highlight')}>
                        {list.itemInfo[0].isHighlight
                          ? t('ItemPage.unmark-as-highlight')
                          : t('ItemPage.mark-as-highlight')}
                      </MenuItem>
                      <MenuItem onClick={() => handleOpen(list)} fontSize={'sm'}>
                        {t('ItemPage.change-quantity')}
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleActionOpen(list)}
                        fontSize={'sm'}
                        color="red.300"
                        isDisabled={isDynamicActionDisabled('remove', list.dynamicType)}
                      >
                        {t('ItemPage.delete-from-list')}
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
