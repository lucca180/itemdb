import { Badge, chakra, Divider, Tooltip, useToast, Box, useDisclosure } from '@chakra-ui/react';
import { ContextMenu, ContextMenuItem, Submenu, ContextMenuTrigger } from 'rctx-contextmenu';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { useAtom } from 'jotai';
import axios from 'axios';
import { useState } from 'react';
import { DuplicatedItemModalProps } from './DuplicatedItemModal';
import dynamic from 'next/dynamic';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';

const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('./DuplicatedItemModal')
);

const CtxMenu = chakra(ContextMenu, {
  baseStyle: {
    background: 'gray.800 !important',
    // padding: "0 !important"
  },
});

const CtxMenuItem = chakra(ContextMenuItem, {
  baseStyle: {
    _hover: {
      background: 'gray.700 !important',
    },
  },
});

const CtxSubmenu = chakra(Submenu, {
  baseStyle: {
    _hover: {
      background: 'gray.700 !important',
      '& > .contextmenu__item': {
        background: 'gray.700 !important',
      },
    },
    '.submenu__item': {
      maxH: 420,
      overflowY: 'auto',
      background: 'gray.800 !important',
      borderColor: 'gray.600 !important',
      '.contextmenu__item': {
        background: 'gray.800 !important',
      },
    },

    '& > .contextmenu__item:after': {
      borderColor: 'transparent transparent transparent #fff !important',
    },

    '.submenu__item > .contextmenu__item:hover': {
      background: 'gray.700 !important',
    },
  },
});

export const CtxTrigger = chakra(ContextMenuTrigger, {
  baseStyle: {
    display: 'inline',
  },
});

type Props = {
  item: ItemData;
  onSelect?: () => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
  onShow?: () => void;
  onHide?: () => void;
};

const ItemCtxMenu = (props: Props) => {
  const t = useTranslations();
  const toast = useToast();
  const { user, getIdToken } = useAuth();
  const [lists, setLists] = useAtom(UserLists);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedList, setSelectedList] = useState<UserList | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ListItemInfo | undefined>();

  const { item, onListAction } = props;

  const fetchLists = async () => {
    props.onShow?.();
    if (!user || lists !== null) return;
    try {
      const token = await getIdToken();

      const res = await axios.get(`/api/v1/lists/${user.username}?includeItems=false`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const listsData = res.data as UserList[];

      setLists(listsData.sort((a, b) => SortListByChange(a, b)));
    } catch (err) {
      console.error(err);
      toast({
        title: t('General.error'),
        description: t('ItemPage.error-fetching-lists'),
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open('/item/' + item.slug, '_blank');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('Layout.copied-to-clipboard'),
      description: text,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const addItemToList = async (list_id: number) => {
    if (!user) return;

    const toastId = toast({
      title: t('Layout.adding-item-to-list'),
      status: 'info',
      duration: null,
      isClosable: true,
    });

    try {
      const token = await getIdToken();

      const res = await axios.put(
        `/api/v1/lists/${user.username}/${list_id}?alertDuplicates=true`,
        {
          items: [
            {
              item_iid: item.internal_id,
            },
          ],
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        toast.update(toastId, {
          title: t('Lists.item-added-to-list'),
          status: 'success',
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error(err);

      if (err.response.data.error === 'Duplicate Items') {
        toast.close(toastId);
        setSelectedList(lists?.find((list) => list.internal_id === list_id));
        setDuplicatedItem(err.response.data.data[0]);
        onOpen();
        return;
      }

      toast.update(toastId, {
        title: t('General.an-error-occurred'),
        description: t('Layout.error-adding-item-to-list'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (typeof window === 'undefined') return <></>;

  return (
    <>
      {isOpen && duplicatedItem && (
        <DuplicatedItemModal
          isOpen={isOpen}
          item={item}
          list={selectedList}
          onClose={onClose}
          itemInfo={duplicatedItem}
        />
      )}
      <CtxMenu
        id={item.internal_id.toString()}
        onShow={fetchLists}
        onHide={props.onHide}
        preventHideOnResize
        preventHideOnScroll
        appendTo="body"
      >
        {props.onSelect ? (
          <CtxMenuItem onClick={props.onSelect}>{t('Layout.select-item')}</CtxMenuItem>
        ) : (
          <></>
        )}
        <CtxMenuItem onClick={handleOpenInNewTab}>{t('Layout.open-in-a-new-tab')}</CtxMenuItem>
        <CtxSubmenu title={t('Layout.add-item-to-list')}>
          {lists &&
            lists.map((list) => (
              <CtxMenuItem
                onClick={() => addItemToList(list.internal_id)}
                key={list.internal_id}
                disabled={!!list.dynamicType && list.dynamicType !== 'addOnly'}
              >
                {list.name}
                {list.purpose !== 'none' && !list.official && (
                  <Tooltip label={`${list.purpose}`} fontSize="sm" placement="top">
                    <Badge ml={1}>{list.purpose === 'seeking' ? 's' : 't'}</Badge>
                  </Tooltip>
                )}
                {list.official && (
                  <Tooltip label={`official`} fontSize="sm" placement="top">
                    <Badge ml={1} colorScheme="blue">
                      ✓
                    </Badge>
                  </Tooltip>
                )}
                {list.dynamicType && (
                  <Tooltip label={`${list.dynamicType} Dynamic List`} fontSize="sm" placement="top">
                    <Badge
                      ml={1}
                      colorScheme="orange"
                      display={'inline-flex'}
                      alignItems="center"
                      p={'2px'}
                    >
                      <NextImage
                        src={DynamicIcon}
                        alt="lightning bolt"
                        width={8}
                        style={{ display: 'inline' }}
                      />
                    </Badge>
                  </Tooltip>
                )}
              </CtxMenuItem>
            ))}
          {(!user || (lists && !lists.length)) && (
            <CtxMenuItem disabled>{t('ItemPage.no-lists-found')}</CtxMenuItem>
          )}
          {!lists && user && <CtxMenuItem disabled>{t('Layout.loading')}...</CtxMenuItem>}
        </CtxSubmenu>
        <Divider />
        <CtxMenuItem onClick={() => handleCopy(item.image)}>
          {t('Layout.copy-image-url')}
        </CtxMenuItem>
        <CtxMenuItem
          onClick={() => handleCopy(`https://itemdb.com.br/item/${item.slug ?? item.internal_id}`)}
        >
          {t('Layout.copy-link')}
        </CtxMenuItem>
        <CtxMenuItem onClick={() => handleCopy(item.name)}>{t('Layout.copy-text')}</CtxMenuItem>
        <Box display={onListAction ? 'inherit' : 'none'}>
          <Divider />
          <CtxMenuItem onClick={() => onListAction?.(item, 'move')}>
            {t('Layout.move-to-list')}
          </CtxMenuItem>
          <CtxMenuItem onClick={() => onListAction?.(item, 'delete')} color="red.400">
            {t('Layout.delete-from-this-list')}
          </CtxMenuItem>
        </Box>
      </CtxMenu>
    </>
  );
};

export default ItemCtxMenu;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
