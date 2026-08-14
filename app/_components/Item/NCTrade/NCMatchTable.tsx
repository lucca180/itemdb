'use client';

import { Badge, Link, Table, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Link as I18nLink } from '@i18n/navigation';
import type { MatchTableLabeledRow } from '@app/_components/Item/NCTrade/matchTableView';

type Props = {
  data: MatchTableLabeledRow[];
  matchCounts?: { [username: string]: number } | null;
  type?: 'seeking' | 'trading';
};

export function NCMatchTable({ data, matchCounts = null, type }: Props) {
  const t = useTranslations();

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
              <Table.Cell colSpan={matchCounts ? 4 : 3} textAlign="center">
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
          {data.map((list) => (
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
              <Table.Cell>{list.lastSeenLabel}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
