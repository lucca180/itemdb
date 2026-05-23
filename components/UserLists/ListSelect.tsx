import { ChevronDownIcon } from '@utils/chakraIcons';
import { Menu, Button, Badge, Tooltip, Portal, Text, Input, Box } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';
import { useLists } from '../../utils/useLists';
import { useTranslations } from 'next-intl';
import { ViewportList } from 'react-viewport-list';

type Props = {
  onChange?: (list: UserList) => void;
  defaultText?: string;
  defaultValue?: UserList;
  createNew?: boolean;
  recommended_id?: number;
  size?: 'sm' | 'md' | 'lg';
  searchThreshold?: number;
};

const LIST_SEARCH_THRESHOLD = 8;

const ListSelect = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const [forceSelected, setSelected] = useState<UserList | undefined>(props.defaultValue);
  const [listSearch, setListSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lists, isLoading, revalidate } = useLists();
  const sorted = useMemo(() => [...lists].sort((a, b) => SortListByChange(a, b)), [lists]);
  const showSearch = sorted.length >= (props.searchThreshold ?? LIST_SEARCH_THRESHOLD);
  const filteredLists = useMemo(() => {
    const search = listSearch.trim().toLowerCase();
    if (!showSearch || !search) return sorted;

    return sorted.filter((list) => list.name.toLowerCase().includes(search));
  }, [listSearch, showSearch, sorted]);
  const prevDefaultValue = useRef(props.defaultValue);
  const menuListRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!isMenuOpen || !showSearch) return;

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isMenuOpen, showSearch]);

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
    <Menu.Root
      lazyMount
      open={isMenuOpen}
      onOpenChange={(details) => {
        setIsMenuOpen(details.open);
        if (!details.open) setListSearch('');
      }}
    >
      <Menu.Trigger asChild>
        <Button
          whiteSpace={'normal'}
          variant="solid"
          size={props.size}
          fontSize={{ base: 'xs', md: 'sm' }}
          loading={isLoading || authLoading}
        >
          {selectedList && (
            <>
              <Text
                as="span"
                display="inline-block"
                maxW={{ base: '140px', md: '220px' }}
                overflow="hidden"
                textOverflow="ellipsis"
                verticalAlign="bottom"
                whiteSpace="nowrap"
                title={selectedList.name}
              >
                {selectedList.name}
              </Text>
              {selectedList.purpose !== 'none' && !selectedList.official && (
                <Badge ml={1}>{selectedList.purpose === 'seeking' ? 's' : 't'}</Badge>
              )}
              {selectedList.official && (
                <Badge ml={1} colorPalette="blue">
                  ✓
                </Badge>
              )}
              {selectedList.dynamicType && (
                <Badge
                  ml={1}
                  colorPalette="orange"
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
          <ChevronDownIcon />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content ref={menuListRef} zIndex="popover" maxH="30vh" overflow="auto">
            {showSearch && (
              <Box p={2}>
                <Input
                  ref={searchInputRef}
                  size="sm"
                  value={listSearch}
                  placeholder={t('Search.search')}
                  variant={'subtle'}
                  bg="blackAlpha.300"
                  borderRadius={'md'}
                  onChange={(e) => setListSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </Box>
            )}
            {sorted.length !== 0 && (
              <>
                <ViewportList
                  items={filteredLists}
                  viewportRef={menuListRef}
                  itemSize={40}
                  initialPrerender={8}
                  overscan={8}
                >
                  {(list) => (
                    <Menu.Item
                      key={list.internal_id}
                      value={String(list.internal_id)}
                      onClick={() => handleSelect(list)}
                    >
                      <Text
                        as="span"
                        flex="1"
                        maxW={'220px'}
                        minW={0}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        title={list.name}
                      >
                        {list.name}
                      </Text>
                      {list.purpose !== 'none' && !list.official && (
                        <Tooltip.Root positioning={{ placement: 'top' }}>
                          <Tooltip.Trigger asChild>
                            <Badge ml={1}>{list.purpose === 'seeking' ? 's' : 't'}</Badge>
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content fontSize="sm">{list.purpose}</Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      )}
                      {list.official && (
                        <Tooltip.Root positioning={{ placement: 'top' }}>
                          <Tooltip.Trigger asChild>
                            <Badge ml={1} colorPalette="blue">
                              ✓
                            </Badge>
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content fontSize="sm">official</Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      )}
                      {list.dynamicType && (
                        <Tooltip.Root positioning={{ placement: 'top' }}>
                          <Tooltip.Trigger asChild>
                            <Badge
                              ml={1}
                              colorPalette="orange"
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
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content fontSize="sm">
                              {list.dynamicType} Dynamic List
                            </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      )}
                    </Menu.Item>
                  )}
                </ViewportList>
                {filteredLists.length === 0 && (
                  <Menu.Item value="no-lists" disabled justifyContent="center">
                    {t('ItemPage.no-lists-found')}
                  </Menu.Item>
                )}
                {props.createNew && <Menu.Separator />}
              </>
            )}

            {user && !isLoading && lists.length === 0 && (
              <Menu.Item value="empty-lists" disabled justifyContent="center">
                {t('ItemPage.no-lists-found')}
              </Menu.Item>
            )}

            {isLoading && (
              <Menu.Item value="loading" disabled justifyContent="center">
                {t('Layout.loading')}...
              </Menu.Item>
            )}

            {!user && !authLoading && (
              <Menu.Item value="login-required" disabled justifyContent="center">
                {t('Lists.login-to-use-lists')}
              </Menu.Item>
            )}

            {user && !isLoading && props.createNew && (
              <Menu.Item value="create-new" onClick={createNewList}>
                + {t('Lists.create-new-list')}
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default ListSelect;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
