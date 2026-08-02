import { Badge, Link, Table, Text } from '@chakra-ui/react';
import { isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import { cacheLife } from 'next/cache';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import { getCachedNow } from '@utils/getCachedNow';
import type { UserList } from '@types';

type MatchTableRow = {
  internal_id: number;
  name: string;
  slug: string | null;
  ownerUsername: string | null;
  ownerLastSeen: string;
};

type CachedProps = {
  data: MatchTableRow[];
  matchCounts: { [username: string]: number } | null;
  type: 'seeking' | 'trading';
};

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
};

/** Strip volatile UserList fields before the cache key is formed. */
export async function MatchTable({ data, matches, type }: Props) {
  const rows: MatchTableRow[] = data.map((list) => ({
    internal_id: list.internal_id,
    name: list.name,
    slug: list.slug,
    ownerUsername: list.owner.username,
    ownerLastSeen: list.owner.lastSeen,
  }));

  const matchCounts = matches
    ? Object.fromEntries(
        Object.entries(matches)
          .map(([username, ids]) => [username, ids.length] as const)
          .sort(([a], [b]) => a.localeCompare(b))
      )
    : null;

  return <MatchTableCached data={rows} matchCounts={matchCounts} type={type} />;
}

async function MatchTableCached({ data, matchCounts, type }: CachedProps) {
  'use cache';
  cacheLife('itemFast');

  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getCachedNow()]);
  const sortedData = [...data].sort((a, b) => {
    const bySeen = new Date(b.ownerLastSeen).getTime() - new Date(a.ownerLastSeen).getTime();
    return bySeen !== 0 ? bySeen : a.internal_id - b.internal_id;
  });
  const lastSeenToday = sortedData.map((list) =>
    isSameDay(new Date(list.ownerLastSeen), now, { in: tz('America/Los_Angeles') })
  );

  return (
    <Table.ScrollArea
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
    >
      <Table.Root
        h="100%"
        variant="outline"
        colorPalette="blackAlpha"
        bg="blackAlpha.300"
        size="sm"
        striped
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('ItemPage.list-name')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('ItemPage.owner')}</Table.ColumnHeader>
            {matchCounts && <Table.ColumnHeader>{t('ItemPage.match')}</Table.ColumnHeader>}
            <Table.ColumnHeader>{t('ItemPage.last-seen')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {!data.length && (
            <Table.Row>
              <Table.Cell colSpan={4} textAlign="center">
                {t('ItemPage.no-lists-found')} :(
                <br />
                <Text fontSize="xs" mt={2} color="whiteAlpha.600">
                  {t.rich('Lists.import-adv-tip', {
                    Link: (chunks) => (
                      <Link asChild color="whiteAlpha.800">
                        <I18nLink href="/lists/import">{chunks}</I18nLink>
                      </Link>
                    ),
                  })}
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
          {sortedData.map((list, index) => (
            <Table.Row key={list.internal_id}>
              <Table.Cell maxW="200px" overflow="hidden" textOverflow="ellipsis">
                <I18nLink
                  href={`/lists/${list.ownerUsername}/${list.slug ?? list.internal_id}`}
                  data-umami-event="match-table"
                  data-umami-event-label="list-name"
                >
                  {list.name}
                </I18nLink>
              </Table.Cell>
              <Table.Cell>
                <I18nLink
                  href={`/lists/${list.ownerUsername}`}
                  data-umami-event="match-table"
                  data-umami-event-label="owner-username"
                >
                  {list.ownerUsername}
                </I18nLink>
              </Table.Cell>
              {matchCounts && (
                <Table.Cell>
                  {matchCounts[list.ownerUsername ?? ''] ? (
                    <Badge colorPalette="green">
                      {matchCounts[list.ownerUsername ?? '']} {t('General.items').toLowerCase()}{' '}
                      {type === 'seeking' ? t('General.they') : t('General.you')}{' '}
                      {t('ItemPage.can-offer')}
                    </Badge>
                  ) : (
                    <Badge colorPalette="whiteAlpha" variant="solid">
                      {t('ItemPage.no-matches')}
                    </Badge>
                  )}
                </Table.Cell>
              )}
              <Table.Cell>
                {lastSeenToday[index]
                  ? t('General.today')
                  : format.relativeTime(new Date(list.ownerLastSeen), now)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export default MatchTable;
