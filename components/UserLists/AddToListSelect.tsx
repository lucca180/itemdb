import { Menu, Button, Badge, Tooltip, Portal, useDisclosure } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import DynamicIcon from '../../public/icons/dynamic.png';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { isDynamicActionDisabled } from '../../utils/utils';
import { DuplicatedItemModalProps } from '../Modal/DuplicatedItemModal';
import { useLists } from '../../utils/useLists';

const DuplicatedItemModal = dynamic<DuplicatedItemModalProps>(
  () => import('../Modal/DuplicatedItemModal')
);

type Props = {
  item: ItemData;
};

const AddToListSelect = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const { user, authLoading } = useAuth();
  const { lists, isLoading, revalidate } = useLists();
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedList, setSelectedList] = useState<UserList | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ListItemInfo | undefined>();
  const toast = useToast();

  const sorted = useMemo(() => [...lists].sort((a, b) => SortListByChange(a, b)), [lists]);

  const addItemToList = async (list_id: number) => {
    if (!user) return;
    try {
      const res = await axios.put(
        `/api/v1/lists/${user.username}/${list_id}?alertDuplicates=true`,
        {
          items: [
            {
              list_id: list_id,
              item_iid: item.internal_id,
            },
          ],
        }
      );
      if (res.data.success) {
        toast({
          id: 'add-to-list-success',
          title: t('Lists.item-added-to-list'),
          status: 'success',
          duration: 5000,
        });

        revalidate();
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
        id: 'add-to-list-error',
        title: t('General.an-error-occurred'),
        status: 'error',
        duration: 5000,
      });
    }
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
        const list = res.data.message;
        addItemToList(list.internal_id);
        revalidate();
      } else throw new Error(res.data.message);
    } catch (err) {
      console.error(err);

      toast({
        id: 'create-list-for-item-error',
        title: t('General.an-error-occurred'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      {duplicatedItem && (
        <DuplicatedItemModal
          isOpen={open}
          item={item}
          list={selectedList}
          onClose={onClose}
          itemInfo={duplicatedItem}
        />
      )}
      <Menu.Root lazyMount>
        <Menu.Trigger asChild>
          <Button colorPalette="whiteAlpha" variant="subtle">
            {t('Lists.add-to-list')}
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content maxH="50vh" overflow="auto">
              {sorted.length !== 0 && (
                <>
                  {sorted.map((list) => (
                    <Menu.Item
                      _hover={{ bg: 'blackAlpha.300' }}
                      cursor="pointer"
                      key={list.internal_id}
                      value={String(list.internal_id)}
                      onClick={() => addItemToList(list.internal_id)}
                      disabled={isDynamicActionDisabled('add', list.dynamicType)}
                      whiteSpace={'wrap'}
                      maxW={'90vw'}
                    >
                      {list.name}
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
                  ))}
                  <Menu.Separator />
                </>
              )}

              {user && !authLoading && !isLoading && (
                <Menu.Item value="create-new" onClick={createNewList}>
                  + {t('Lists.create-new-list')}
                </Menu.Item>
              )}

              {(authLoading || isLoading) && (
                <Menu.Item value="loading" justifyContent="center" disabled>
                  {t('Layout.loading')}....
                </Menu.Item>
              )}
              {!user && !authLoading && (
                <Menu.Item value="login-required" justifyContent="center" disabled>
                  {t('Lists.login-to-use-lists')}
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </>
  );
};

export default AddToListSelect;

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  return dateB.getTime() - dateA.getTime();
}
