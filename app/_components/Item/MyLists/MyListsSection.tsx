import { getTranslations } from 'next-intl/server';
import { MyListsCard } from '@app/_components/Item/MyLists/MyListsCard';
import { getItemMyLists } from '@pages/api/v1/items/[id_name]/mylists';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function MyListsSection({ item }: Props) {
  const [{ user }, t] = await Promise.all([getServerCurrentUser(), getTranslations()]);

  if (!user) return null;

  const lists = (await getItemMyLists(item.internal_id, user.id)).filter((list) => !list.official);

  if (!lists.length) return null;

  const labels = {
    title: t('Layout.my-lists'),
    changesSaved: t('General.changes-saved'),
    somethingWentWrong: t('General.something-went-wrong'),
    tryAgainLater: t('General.try-again-later'),
    saving: t('General.saving'),
    hidden: t('Lists.hidden'),
    highlight: t('Lists.highlight'),
    listNoDescription: t('ItemPage.list-no-description'),
    markAsHidden: t('ItemPage.mark-as-hidden'),
    unmarkAsHidden: t('ItemPage.unmark-as-hidden'),
    markAsHighlight: t('ItemPage.mark-as-highlight'),
    unmarkAsHighlight: t('ItemPage.unmark-as-highlight'),
    changeQuantity: t('ItemPage.change-quantity'),
    deleteFromList: t('ItemPage.delete-from-list'),
  };

  return <MyListsCard item={item} labels={labels} lists={lists} />;
}
