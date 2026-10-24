import { Menu, Badge, Tooltip, Portal, Text, Input, Box, Icon } from '@chakra-ui/react';
import { BsBoxArrowInRight } from 'react-icons/bs';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UserListLite } from '@types';
import { useAuth } from '@utils/auth';
import type { LoginSource } from '@utils/loginModal';
import DynamicIcon from '@assets/icons/dynamic.png';
import NextImage from 'next/image';
import { useLists } from '@utils/useLists';
import { useTranslations } from 'next-intl';
import { ViewportList } from 'react-viewport-list';

type Props = {
  /** Menu trigger element (rendered through `Menu.Trigger asChild`). */
  children: ReactNode;
  onSelect: (list: UserListLite) => void;
  /** When provided, shows the "+ create new list" entry for logged-in users. */
  onCreateNew?: () => void;
  isItemDisabled?: (list: UserListLite) => boolean;
  searchThreshold?: number;
  portalRef?: RefObject<HTMLElement | null>;
  /** Umami event name. Tracks menu open, list selection and list creation. */
  trackEvent?: string;
  /** Login modal context for logged-out users (defaults to `add-to-list`). */
  loginSource?: LoginSource;
  /** Login funnel `trigger` for logged-out users (defaults to `list-select`). */
  loginTrigger?: string;
};

const LIST_SEARCH_THRESHOLD = 8;

/** Shared lists menu: search (above a threshold), virtualized list, create-new and login states. */
const ListMenu = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading, openLogin } = useAuth();
  const { lists, isLoading } = useLists();
  const [listSearch, setListSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sorted = useMemo(() => [...lists].sort((a, b) => SortListByChange(a, b)), [lists]);
  const showSearch = sorted.length >= (props.searchThreshold ?? LIST_SEARCH_THRESHOLD);
  const filteredLists = useMemo(() => {
    const search = listSearch.trim().toLowerCase();
    if (!showSearch || !search) return sorted;

    return sorted.filter((list) => list.name.toLowerCase().includes(search));
  }, [listSearch, showSearch, sorted]);
  const menuListRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen || !showSearch) return;

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isMenuOpen, showSearch]);

  return (
    <Menu.Root
      lazyMount
      open={isMenuOpen}
      onOpenChange={(details) => {
        setIsMenuOpen(details.open);
        if (details.open && props.trackEvent) {
          window.umami?.track(props.trackEvent, { label: 'open' });
        }
        if (!details.open) setListSearch('');
      }}
    >
      <Menu.Trigger asChild>{props.children}</Menu.Trigger>
      <Portal container={props.portalRef}>
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
                      onClick={() => {
                        if (props.trackEvent)
                          window.umami?.track(props.trackEvent, { label: 'select' });
                        props.onSelect(list);
                      }}
                      disabled={props.isItemDisabled?.(list)}
                      _hover={{ bg: 'whiteAlpha.100' }}
                      cursor="pointer"
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
                              {list.dynamicType} {t('General.dynamic-list')}
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
                {props.onCreateNew && <Menu.Separator />}
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
              <Menu.Item
                value="login-required"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={() =>
                  openLogin(props.loginSource ?? 'add-to-list', {
                    trigger: props.loginTrigger ?? 'list-select',
                  })
                }
              >
                <Icon as={BsBoxArrowInRight} />
                {t('Lists.login-to-use-lists')}
              </Menu.Item>
            )}

            {user && !isLoading && props.onCreateNew && (
              <Menu.Item
                value="create-new"
                onClick={() => {
                  if (props.trackEvent)
                    window.umami?.track(props.trackEvent, { label: 'create-new' });
                  props.onCreateNew?.();
                }}
                _hover={{ bg: 'whiteAlpha.100' }}
                cursor="pointer"
              >
                + {t('Lists.create-new-list')}
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default ListMenu;

function SortListByChange(a: UserListLite, b: UserListLite) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
