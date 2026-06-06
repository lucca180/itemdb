import { Badge, Link, Table, Text } from '@chakra-ui/react';
import { isToday } from 'date-fns';
import { tz } from '@date-fns/tz';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import type { UserList } from '@types';

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
};

export async function MatchTable({ data, matches, type }: Props) {
  const t = await getTranslations();
  const format = await getFormatter();
  const sortedData = [...data].sort(
    (a, b) => new Date(b.owner.lastSeen).getTime() - new Date(a.owner.lastSeen).getTime()
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
            {matches && <Table.ColumnHeader>{t('ItemPage.match')}</Table.ColumnHeader>}
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
          {sortedData.map((list) => (
            <Table.Row key={list.internal_id}>
              <Table.Cell maxW="200px" overflow="hidden" textOverflow="ellipsis">
                <I18nLink
                  href={`/lists/${list.owner.username}/${list.slug ?? list.internal_id}`}
                  data-umami-event="match-table"
                  data-umami-event-label="list-name"
                >
                  {list.name}
                </I18nLink>
              </Table.Cell>
              <Table.Cell>
                <I18nLink
                  href={`/lists/${list.owner.username}`}
                  data-umami-event="match-table"
                  data-umami-event-label="owner-username"
                >
                  {list.owner.username}
                </I18nLink>
              </Table.Cell>
              {matches && (
                <Table.Cell>
                  {matches[list.owner.username ?? '']?.length ? (
                    <Badge colorPalette="green">
                      {matches[list.owner.username ?? '']?.length}{' '}
                      {t('General.items').toLowerCase()}{' '}
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
                {isToday(new Date(list.owner.lastSeen), { in: tz('America/Los_Angeles') })
                  ? t('General.today')
                  : format.relativeTime(new Date(list.owner.lastSeen))}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export default MatchTable;
