import { Badge, chakra, Divider, Tooltip, useToast } from "@chakra-ui/react";
import { ContextMenu, ContextMenuItem, Submenu, ContextMenuTrigger} from "rctx-contextmenu";
import { ItemData, UserList } from "../../types";
import { useAuth, UserLists } from "../../utils/auth";
import { useRecoilState } from 'recoil';
import axios from 'axios';

const CtxMenu = chakra(ContextMenu, { baseStyle:{
  background: 'gray.800 !important',
  // padding: "0 !important"
}});

const CtxMenuItem = chakra(ContextMenuItem, { baseStyle:{
  _hover: {
    background: 'gray.700 !important',
  }
}});

const CtxSubmenu = chakra(Submenu, { baseStyle:{
  _hover: {
    background: 'gray.700 !important',
    '& > .contextmenu__item': {
      background: 'gray.700 !important',
    },  
  },
  '.submenu__item':{
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
}});

export const CtxTrigger = chakra(ContextMenuTrigger, {
  baseStyle: {
    display: 'inline',
  },
})

type Props = {
  item: ItemData;
};

const ItemCtxMenu = (props: Props) => {
  const toast = useToast();
  const { user, getIdToken } = useAuth();
  const [lists, setLists] = useRecoilState(UserLists);

  const { item } = props;

  const fetchLists = async () => {
    if (!user || lists?.length) return;
    try {
      const token = await getIdToken();

      const res = await axios.get(`/api/v1/lists/${user.username}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const listsData = res.data as UserList[];

      setLists(listsData.sort((a, b) => SortListByChange(a, b)));

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "An error occurred while fetching your lists, please try again later.",
        status: "error",
        duration: 2000,
      })
    }
  }

  const handleOpenInNewTab = () => {
    window.open('/item/' + item.internal_id, '_blank');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: text,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }

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
        `/api/v1/lists/${user.username}/${list_id}`,
        {
          items: [
            {
              list_id: list_id,
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
    } catch (err) {
      console.error(err);

      toast.update(toastId, {
        title: 'An error occurred',
        description: 'An error occurred while adding the item to the list, please try again later.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <CtxMenu id={item.internal_id.toString()} onShow={fetchLists} preventHideOnResize preventHideOnScroll>
        <CtxMenuItem onClick={handleOpenInNewTab}>Open in a New Tab</CtxMenuItem>
        <CtxSubmenu
          title="Add to List"
        >
          {lists && lists.map((list) => <CtxMenuItem onClick={() => addItemToList(list.internal_id)} key={list.internal_id}>
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
          </CtxMenuItem>)}
          {(!lists || !lists.length) && <CtxMenuItem disabled>No lists found</CtxMenuItem>}
        </CtxSubmenu>
        <Divider/>
        <CtxMenuItem onClick={() => handleCopy(item.image)}>Copy Image</CtxMenuItem>
        <CtxMenuItem onClick={() => handleCopy(`https://itemdb.com.br/item/${item.internal_id}`)}>Copy Link</CtxMenuItem>
        <CtxMenuItem onClick={() => handleCopy(item.name)}>Copy Text</CtxMenuItem>
      </CtxMenu>
  )
};

export default ItemCtxMenu;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}