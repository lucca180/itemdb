import { ChevronDownIcon } from '@utils/theme/chakraIcons';
import { Button, Badge, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UserListLite } from '@types';
import { useAuth } from '@utils/auth';
import type { LoginSource } from '@utils/loginModal';
import DynamicIcon from '@assets/icons/dynamic.png';
import NextImage from 'next/image';
import { useLists } from '@utils/useLists';
import { useToast } from '@utils/theme/toast';
import { useTranslations } from 'next-intl';
import ListMenu from '@components/UserLists/ListMenu';

type Props = {
  onChange?: (list: UserListLite) => void;
  defaultText?: string;
  defaultValue?: UserListLite;
  createNew?: boolean;
  recommended_id?: number;
  size?: 'sm' | 'md' | 'lg';
  searchThreshold?: number;
  portalRef?: RefObject<HTMLElement | null>;
  /** Umami event name. Tracks menu open, user list selection and list creation. */
  trackEvent?: string;
  /** Login modal context for logged-out users (defaults to `add-to-list`). */
  loginSource?: LoginSource;
  /** Login funnel `trigger` for logged-out users (defaults to `list-select`). */
  loginTrigger?: string;
};

const ListSelect = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const toast = useToast();
  const [forceSelected, setSelected] = useState<UserListLite | undefined>(props.defaultValue);
  const [isCreating, setIsCreating] = useState(false);
  const { lists, isLoading, revalidate } = useLists();
  const sorted = useMemo(() => [...lists].sort((a, b) => SortListByChange(a, b)), [lists]);
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

  const handleSelect = (list: UserListLite) => {
    setSelected(list);
    if (props.onChange) props.onChange(list);
  };

  // creates a list with a random name and selects it right away
  const createNewList = async () => {
    if (!user || isCreating) return;
    setIsCreating(true);
    try {
      const res = await axios.post(`/api/v1/lists/${user.username}`, {
        description: '',
        cover_url: '',
        visibility: 'public',
        purpose: 'none',
        colorHex: '#fff',
      });

      if (!res.data.success) throw new Error(res.data.message);

      const newList = res.data.message as UserListLite;
      revalidate();
      handleSelect(newList);

      toast({
        id: 'list-select-created',
        title: t('Lists.list-created', { name: newList.name }),
        status: 'success',
        duration: 5000,
      });
    } catch (err) {
      console.error(err);
      toast({
        id: 'list-select-created',
        title: t('General.something-went-wrong-please-try-again-later'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ListMenu
      onSelect={handleSelect}
      onCreateNew={props.createNew ? createNewList : undefined}
      searchThreshold={props.searchThreshold}
      portalRef={props.portalRef}
      trackEvent={props.trackEvent}
      loginSource={props.loginSource}
      loginTrigger={props.loginTrigger}
    >
      <Button
        whiteSpace={'normal'}
        colorPalette={'whiteAlpha'}
        variant="subtle"
        size={props.size}
        fontSize={{ base: 'xs', md: 'sm' }}
        loading={isLoading || authLoading || isCreating}
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
    </ListMenu>
  );
};

export default ListSelect;

function SortListByChange(a: UserListLite, b: UserListLite) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
