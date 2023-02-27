import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Icon,
  MenuGroup,
  MenuDivider,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BsBookmarkCheckFill } from 'react-icons/bs';
import { ItemData, UserList } from '../../types';
import { useAuth } from '../../utils/auth';

type Props = {
  item: ItemData;
};

const AddToListSelect = (props: Props) => {
  const { item } = props;
  const { user, getIdToken, authLoading } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const toast = useToast();

  const seeking = lists
    .filter((list) => list.purpose === 'seeking')
    .sort((a, b) => SortListByItem(a, b, item));
  console.log(seeking);
  const trading = lists.filter((list) => list.purpose === 'trading');
  const none = lists.filter((list) => list.purpose === 'none');

  useEffect(() => {
    if (!authLoading && user) {
      init();
    }
  }, [authLoading, user]);

  const init = async () => {
    if (!user) return;
    try {
      const token = await getIdToken();

      const res = await axios.get(
        `/api/lists/getUserLists?username=${user.username}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      setLists(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const addItemToList = async (list_id: number) => {
    if (!user) return;
    try {
      const token = await getIdToken();

      const res = await axios.post(
        `/api/lists/addItem`,
        {
          list_id: list_id,
          item_iid: item.internal_id,
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
    } catch (err) {
      console.log(err);

      toast({
        title: 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Menu>
      <MenuButton as={Button} variant="solid">
        Add To List
      </MenuButton>
      <MenuList maxH="50vh" overflow="auto">
        {seeking.length !== 0 && (
          <>
            <MenuGroup title="Seeking" />
            {seeking.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => addItemToList(list.internal_id)}
              >
                {list.itemInfo.some((i) => i.item_iid === item.internal_id) && (
                  <Tooltip
                    label="Already in this list"
                    fontSize="sm"
                    placement="top"
                  >
                    <span>
                      <Icon
                        verticalAlign="middle"
                        as={BsBookmarkCheckFill}
                        mr={2}
                      />
                    </span>
                  </Tooltip>
                )}
                {list.name}
              </MenuItem>
            ))}
            <MenuDivider />
          </>
        )}

        {trading.length !== 0 && (
          <>
            <MenuGroup title="Trading" />
            {trading.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => addItemToList(list.internal_id)}
              >
                {list.itemInfo.some((i) => i.item_iid === item.internal_id) && (
                  <Tooltip
                    label="Already in this list"
                    fontSize="sm"
                    placement="top"
                  >
                    <span>
                      <Icon
                        verticalAlign="middle"
                        as={BsBookmarkCheckFill}
                        mr={2}
                      />
                    </span>
                  </Tooltip>
                )}
                {list.name}
              </MenuItem>
            ))}
            <MenuDivider />
          </>
        )}

        {none.length !== 0 && (
          <>
            {none.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => addItemToList(list.internal_id)}
              >
                {list.itemInfo.some((i) => i.item_iid === item.internal_id) && (
                  <Tooltip
                    label="Already in this list"
                    fontSize="sm"
                    placement="top"
                  >
                    <span>
                      <Icon
                        verticalAlign="middle"
                        as={BsBookmarkCheckFill}
                        mr={2}
                      />
                    </span>
                  </Tooltip>
                )}
                {list.name}
              </MenuItem>
            ))}
            <MenuDivider />
          </>
        )}

        {user && !authLoading && lists.length === 0 && (
          <MenuItem justifyContent="center" disabled>
            No lists found
          </MenuItem>
        )}

        {authLoading && (
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
  );
};

export default AddToListSelect;

function SortListByItem(a: UserList, b: UserList, item: ItemData) {
  const aHasItem = a.itemInfo.some((i) => i.item_iid === item.internal_id);
  const bHasItem = b.itemInfo.some((i) => i.item_iid === item.internal_id);

  if (aHasItem && !bHasItem) return 1;
  if (!aHasItem && bHasItem) return -1;
  return (
    (a.order ?? 0) - (b.order ?? 0) ||
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
