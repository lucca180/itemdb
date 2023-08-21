import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Icon,
  MenuDivider,
  Tooltip,
  useToast,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BsBookmarkCheckFill } from 'react-icons/bs';
import { useAtom } from 'jotai';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useAuth, UserLists } from '../../utils/auth';
import { getRandomName } from '../../utils/randomName';
import DuplicatedItemModal from '../Modal/DuplicatedItemModal';

type Props = {
  item: ItemData;
};

const AddToListSelect = (props: Props) => {
  const { item } = props;
  const { user, getIdToken, authLoading } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [, setStorageLists] = useAtom(UserLists);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedList, setSelectedList] = useState<UserList | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ListItemInfo | undefined>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const sorted = [...lists].sort((a, b) => SortListByChange(a, b));

  useEffect(() => {
    if (!authLoading && user) {
      init();
    }
  }, [authLoading, user]);

  const init = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();

      const res = await axios.get(`/api/v1/lists/${user.username}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      setLists(res.data);
      setStorageLists(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const addItemToList = async (list_id: number) => {
    if (!user) return;
    try {
      const token = await getIdToken();

      const res = await axios.put(
        `/api/v1/lists/${user.username}/${list_id}?alertDuplicates=true`,
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
        toast({
          title: 'Item added to list',
          status: 'success',
          duration: 5000,
        });

        init();
      }
    } catch (err: any) {
      console.error(err);

      if (err.response.data.error === 'Duplicate Items') {
        setSelectedList(lists.find((list) => list.internal_id === list_id));
        setDuplicatedItem(err.response.data.data[0]);
        onOpen();
        return;
      }

      toast({
        title: 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const createNewList = async () => {
    if (!user) return;
    const token = await getIdToken();
    try {
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
        addItemToList(list.internal_id);
        setStorageLists(null);
        init();
      } else throw new Error(res.data.message);
    } catch (err) {
      console.error(err);

      toast({
        title: 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      {duplicatedItem && (
        <DuplicatedItemModal
          isOpen={isOpen}
          item={item}
          list={selectedList}
          onClose={onClose}
          itemInfo={duplicatedItem}
        />
      )}
      <Menu>
        <MenuButton as={Button} variant="solid">
          Add To List
        </MenuButton>
        <MenuList maxH="50vh" overflow="auto">
          {sorted.length !== 0 && (
            <>
              {sorted.map((list) => (
                <MenuItem key={list.internal_id} onClick={() => addItemToList(list.internal_id)}>
                  {list.itemInfo.some((i) => i.item_iid === item.internal_id) && (
                    <Tooltip label="Already in this list" fontSize="sm" placement="top">
                      <span>
                        <Icon verticalAlign="middle" as={BsBookmarkCheckFill} mr={2} />
                      </span>
                    </Tooltip>
                  )}
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
                </MenuItem>
              ))}
              <MenuDivider />
            </>
          )}

          {user && !authLoading && !isLoading && (
            <MenuItem onClick={createNewList}>+ Create New List</MenuItem>
          )}

          {(authLoading || isLoading) && (
            <MenuItem justifyContent="center" disabled>
              Loading....
            </MenuItem>
          )}
          {!user && !authLoading && (
            <MenuItem justifyContent="center" disabled>
              Login to use lists
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </>
  );
};

export default AddToListSelect;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
