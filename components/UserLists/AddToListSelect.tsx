import { Button, useDisclosure } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useState } from 'react';
import { ItemData, ListItemInfo, UserListLite } from '../../types';
import { useAuth } from '../../utils/auth';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { isDynamicActionDisabled } from '../../utils/utils';
import { useLists } from '../../utils/useLists';
import ListMenu from '@components/UserLists/ListMenu';
import type { SuggestItemToListModalProps } from '@components/Modal/SuggestItemToListModal';

const DuplicatedItemModal = dynamic(() => import('../Modal/DuplicatedItemModal'));
const SuggestItemToListModal = dynamic<SuggestItemToListModalProps>(
  () => import('@components/Modal/SuggestItemToListModal')
);

/** Item page "Add to list" menu: open / select / create-new. */
const TRACK_EVENT = 'item-add-to-list';

type Props = {
  item: ItemData;
};

const AddToListSelect = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const { user } = useAuth();
  const { lists, revalidate } = useLists();
  const { open, onOpen, onClose } = useDisclosure();
  const { open: isOpenSuggest, onOpen: onOpenSuggest, onClose: onCloseSuggest } = useDisclosure();
  const [selectedList, setSelectedList] = useState<UserListLite | undefined>();
  const [duplicatedItem, setDuplicatedItem] = useState<ListItemInfo | undefined>();
  const toast = useToast();

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
      const res = await axios.post(`/api/v1/lists/${user.username}`, {
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
      {isOpenSuggest && (
        <SuggestItemToListModal
          isOpen={isOpenSuggest}
          onClose={onCloseSuggest}
          item={item}
          source="item-page-menu"
        />
      )}
      <ListMenu
        onSelect={(list) => addItemToList(list.internal_id)}
        onCreateNew={createNewList}
        onSuggestOfficial={onOpenSuggest}
        isItemDisabled={(list) => isDynamicActionDisabled('add', list.dynamicType)}
        trackEvent={TRACK_EVENT}
        loginSource="add-to-list"
        loginTrigger="item-page-list-menu"
      >
        <Button colorPalette="whiteAlpha" variant="subtle" w="100%">
          {t('Lists.add-to-list')}
        </Button>
      </ListMenu>
    </>
  );
};

export default AddToListSelect;
