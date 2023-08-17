import { Badge, chakra, Divider, Tooltip, useToast, Box, useDisclosure } from '@chakra-ui/react';
import { ContextMenu, ContextMenuItem, Submenu, ContextMenuTrigger } from 'rctx-contextmenu';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { useRecoilState } from 'recoil';
import axios from 'axios';
import { useState } from 'react';
import { DuplicatedItemModalProps } from './DuplicatedItemModal';
import dynamic from 'next/dynamic';

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

export const CtxTrigger = chakra(typeof window === 'undefined' ? 'div' : ContextMenuTrigger, {
  baseStyle: {
    display: 'inline',
  },
});

type Props = {
  item: ItemData;
  onSelect?: () => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
};

const ItemCtxMenu = (props: Props) => {
  const toast = useToast();
  const { user, getIdToken } = useAuth();
  const [lists, setLists] = useRecoilState(UserLists);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedList, setSelectedList] = useState<UserList | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ListItemInfo | undefined>();

  const { item, onListAction } = props;

  const fetchLists = async () => {
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
        title: 'Error',
        description: 'An error occurred while fetching your lists, please try again later.',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open('/item/' + item.internal_id, '_blank');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: text,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const addItemToList = async (list_id: number) => {
    if (!user) return;

    const toastId = toast({
      title: 'Adding item to list...',
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
          title: 'Item added to list',
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
        title: 'An error occurred',
        description: 'An error occurred while adding the item to the list, please try again later.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (typeof window === 'undefined') return <></>;

  return (
    <>
      {isOpen && (
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
        preventHideOnResize
        preventHideOnScroll
        appendTo="body"
      >
        {props.onSelect ? <CtxMenuItem onClick={props.onSelect}>Select Item</CtxMenuItem> : <></>}
        <CtxMenuItem onClick={handleOpenInNewTab}>Open in a New Tab</CtxMenuItem>
        <CtxSubmenu title="Add to List">
          {lists &&
            lists.map((list) => (
              <CtxMenuItem onClick={() => addItemToList(list.internal_id)} key={list.internal_id}>
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
              </CtxMenuItem>
            ))}
          {(!user || (lists && !lists.length)) && (
            <CtxMenuItem disabled>No lists found</CtxMenuItem>
          )}
          {!lists && user && <CtxMenuItem disabled>Loading...</CtxMenuItem>}
        </CtxSubmenu>
        <Divider />
        <CtxMenuItem onClick={() => handleCopy(item.image)}>Copy Image URL</CtxMenuItem>
        <CtxMenuItem
          onClick={() => handleCopy(`https://itemdb.com.br/item/${item.slug ?? item.internal_id}`)}
        >
          Copy Link
        </CtxMenuItem>
        <CtxMenuItem onClick={() => handleCopy(item.name)}>Copy Text</CtxMenuItem>
        <Box display={onListAction ? 'inherit' : 'none'}>
          <Divider />
          <CtxMenuItem onClick={() => onListAction?.(item, 'move')}>Move to List</CtxMenuItem>
          <CtxMenuItem onClick={() => onListAction?.(item, 'delete')} color="red.400">
            Delete from this list
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
