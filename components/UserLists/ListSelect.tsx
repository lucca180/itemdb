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
import { useEffect, useMemo, useRef, useState } from 'react';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';
import { useLists } from '../../utils/useLists';
import { useTranslations } from 'next-intl';

type Props = {
  onChange?: (list: UserList) => void;
  defaultText?: string;
  defaultValue?: UserList;
  createNew?: boolean;
  recommended_id?: number;
  size?: 'sm' | 'md' | 'lg';
};

const ListSelect = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const [forceSelected, setSelected] = useState<UserList | undefined>(props.defaultValue);
  const { lists, isLoading, revalidate } = useLists();
  const sorted = useMemo(() => lists.sort((a, b) => SortListByChange(a, b)), [lists]);
  const prevDefaultValue = useRef(props.defaultValue);

  const selectedList = useMemo(() => {
    if (props.defaultValue && prevDefaultValue.current !== props.defaultValue) {
      prevDefaultValue.current = props.defaultValue;
      setSelected(props.defaultValue);
      return props.defaultValue;
    }

    return forceSelected || props.defaultValue;
  }, [forceSelected, props.defaultValue]);

  useEffect(() => {
    if (!props.recommended_id || !sorted || forceSelected) return;
    const recommended = sorted.find((l) => l.linkedListId === props.recommended_id);
    if (recommended) handleSelect(recommended);
  }, [sorted, props.recommended_id, forceSelected]);

  const handleSelect = (list: UserList) => {
    setSelected(list);
    if (props.onChange) props.onChange(list);
  };

  const createNewList = async () => {
    if (!user) return;
    try {
      const getRandomName = (await import('../../utils/randomName')).getRandomName;

      const res = await axios.post(`/api/v1/lists/${user.username}`, {
        name: getRandomName(),
        description: '',
        cover_url: '',
        visibility: 'public',
        purpose: 'none',
        colorHex: '#fff',
      });

      if (res.data.success) {
        revalidate();
      } else throw new Error(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Menu isLazy>
      <MenuButton
        whiteSpace={'normal'}
        as={Button}
        variant="solid"
        rightIcon={<ChevronDownIcon />}
        size={props.size}
        fontSize={{ base: 'xs', md: 'sm' }}
        isLoading={isLoading || authLoading}
      >
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
        {!selectedList && (props.defaultText ?? t('Lists.select-list'))}
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
              {t('ItemPage.no-lists-found')}
            </MenuItem>
          )}

          {isLoading && (
            <MenuItem justifyContent="center" disabled>
              {t('Layout.loading')}...
            </MenuItem>
          )}

          {!user && !authLoading && (
            <MenuItem justifyContent="center" disabled>
              {t('Lists.login-to-use-lists')}
            </MenuItem>
          )}

          {user && !isLoading && props.createNew && (
            <MenuItem onClick={createNewList}>+ {t('Lists.create-new-list')}</MenuItem>
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
