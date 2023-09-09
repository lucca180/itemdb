import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Badge,
  Tooltip,
  MenuDivider,
  Portal,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { getRandomName } from '../../utils/randomName';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';

type Props = {
  onChange?: (list: UserList) => void;
  defaultText?: string;
  defaultValue?: UserList;
  createNew?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const ListSelect = (props: Props) => {
  const { user, getIdToken, authLoading } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [selectedList, setSelected] = useState<UserList | undefined>(props.defaultValue);
  const [isLoading, setLoading] = useState<boolean>(true);
  const sorted = lists.sort((a, b) => SortListByChange(a, b));

  useEffect(() => {
    if (!authLoading && user) {
      init();
    }
  }, [authLoading, user]);

  const init = async () => {
    if (!user) return;
    try {
      const token = await getIdToken();

      const res = await axios.get(`/api/v1/lists/${user.username}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      setLists(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (list: UserList) => {
    setSelected(list);
    if (props.onChange) props.onChange(list);
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
        init();
      } else throw new Error(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Menu>
      <MenuButton as={Button} variant="solid" rightIcon={<ChevronDownIcon />} size={props.size}>
        {selectedList && (
          <>
            {selectedList.name}
            {selectedList.purpose !== 'none' && !selectedList.official && (
              <Badge ml={1}>{selectedList.purpose === 'seeking' ? 's' : 't'}</Badge>
            )}
            {selectedList.official && (
              <Badge ml={1} colorScheme="blue">
                ✓
              </Badge>
            )}
            {selectedList.dynamicType && (
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
            )}
          </>
        )}
        {!selectedList && (props.defaultText ?? 'Select List')}
      </MenuButton>
      <Portal>
        <MenuList zIndex={2000} maxH="30vh" overflow="auto">
          {sorted.length !== 0 && (
            <>
              {sorted.map((list) => (
                <MenuItem key={list.internal_id} onClick={() => handleSelect(list)}>
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
                    <Tooltip
                      label={`${list.dynamicType} Dynamic List`}
                      fontSize="sm"
                      placement="top"
                    >
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
                </MenuItem>
              ))}
              {props.createNew && <MenuDivider />}
            </>
          )}

          {user && !isLoading && lists.length === 0 && (
            <MenuItem justifyContent="center" disabled>
              No lists found
            </MenuItem>
          )}

          {isLoading && (
            <MenuItem justifyContent="center" disabled>
              Loading....
            </MenuItem>
          )}

          {!user && !authLoading && (
            <MenuItem justifyContent="center" disabled>
              Login to use lists
            </MenuItem>
          )}

          {user && !isLoading && props.createNew && (
            <MenuItem onClick={createNewList}>+ Create New List</MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default ListSelect;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
