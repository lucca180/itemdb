import type { Metadata } from 'next';
import { Suspense } from 'react';
import Color from 'color';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { stripMarkdown } from '@utils/utils';
import {
  getListCore,
  getListFullItems,
  getListMatches,
  getListPreload,
  getSimilarListsForList,
} from './loadListPage';
import { getListLoadingStrategy, type ListCore, type ListPageClientCore } from './listPage';
import { ItemGridSkeleton, ListFullItemsReceiver, ListPageClient } from './ListPageClient';

type ListDetailPageProps = {
  params: Promise<{ locale: string; username: string; list_id: string }>;
};

export async function generateMetadata({ params }: ListDetailPageProps): Promise<Metadata> {
  const { locale, username, list_id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { list } = await getListCore(locale, username, list_id);

  const listUsername = list.official ? 'official' : (list.owner.username ?? username);
  const pathname = `/lists/${listUsername}/${list.slug ?? list.internal_id}` as `/${string}`;

  const pageProps = getStaticAppPageProps(locale, {
    title: `${list.name} - ${
      list.official
        ? t('Lists.neopets-lists')
        : t('Lists.owner-username-s-lists', { username: list.owner.username ?? '' })
    }`,
    description: stripMarkdown(list.description ?? '') || undefined,
    pathname,
    noindex: !list.official,
    nofollow: !list.official,
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [
        {
          url: list.coverURL ?? 'https://itemdb.com.br/logo_icon.png',
          width: 150,
          height: 150,
        },
      ],
    },
  };
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor="#4A5568b8" />}>
      <ListDetailPageContent params={params} />
    </Suspense>
  );
}

async function ListFullItemsSlot({ core }: { core: ListCore }) {
  const data = await getListFullItems(core);
  return <ListFullItemsReceiver data={data} />;
}

async function ListPageBody({
  locale,
  username,
  list_id,
  core,
}: {
  locale: string;
  username: string;
  list_id: string;
  core: ListCore;
}) {
  const [initialPreload, matches, similarLists] = await Promise.all([
    getListPreload(core),
    getListMatches(core),
    getSimilarListsForList(core.list),
  ]);
  const itemCount = core.list.itemCount ?? 0;
  const { useSuspenseFullLoad } = getListLoadingStrategy(itemCount);
  const clientCore: ListPageClientCore = {
    list: core.list,
    canEdit: core.canEdit,
    isOwner: core.isOwner,
  };

  return (
    <ListPageClient
      key={`${username}/${core.list.internal_id}`}
      locale={locale}
      username={username}
      listId={list_id}
      core={clientCore}
      useSuspenseFullLoad={useSuspenseFullLoad}
      initialPreload={initialPreload}
      matches={matches}
      similarLists={similarLists}
    >
      {useSuspenseFullLoad ? (
        <Suspense
          fallback={
            initialPreload.infoIds.length > 0 ? null : <ItemGridSkeleton count={itemCount} />
          }
        >
          <ListFullItemsSlot core={core} />
        </Suspense>
      ) : null}
    </ListPageClient>
  );
}

async function ListDetailPageContent({ params }: ListDetailPageProps) {
  const { locale, username, list_id } = await params;
  setRequestLocale(locale);

  const core = await getListCore(locale, username, list_id);
  const color = Color(core.list.colorHex || '#4A5568');
  const mainColor = `${color.hex()}b8`;

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <ListPageBody locale={locale} username={username} list_id={list_id} core={core} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
