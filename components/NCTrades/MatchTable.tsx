import { Table, Badge, Link, Skeleton, Text } from '@chakra-ui/react';
import { isToday } from 'date-fns';
import { UserList } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { tz } from '@date-fns/tz';
import MainLink from '@components/Utils/MainLink';

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
  isLoading?: boolean;
};

const MatchTable = (props: Props) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { data, matches, type, isLoading } = props;
  const sortedData = data.sort(
    (a, b) => new Date(b.owner.lastSeen).getTime() - new Date(a.owner.lastSeen).getTime()
  );

  return (
    <Table.ScrollArea
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
    >
      <Table.Root h="100%" variant="line" colorPalette="gray" size="sm" striped>
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
                      <Link color="whiteAlpha.800" href="/lists/import">
                        {chunks}
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
                <MainLink
                  href={`/lists/${list.owner.username}/${list.slug ?? list.internal_id}`}
                  trackEvent="match-table"
                  trackEventLabel="list-name"
                >
                  {list.name}
                </MainLink>
              </Table.Cell>
              <Table.Cell>
                <MainLink
                  href={`/lists/${list.owner.username}`}
                  trackEvent="match-table"
                  trackEventLabel="owner-username"
                >
                  {list.owner.username}
                </MainLink>
              </Table.Cell>
              {!isLoading && matches && (
                <Table.Cell>
                  {matches[list.owner.username ?? '']?.length && (
                    <Badge colorPalette="green">
                      {matches[list.owner.username ?? '']?.length || 'none'}{' '}
                      {t('General.items').toLowerCase()}{' '}
                      {type === 'seeking' ? t('General.they') : t('General.you')}{' '}
                      {t('ItemPage.can-offer')}
                    </Badge>
                  )}
                  {!matches[list.owner.username ?? '']?.length && (
                    <Badge>{t('ItemPage.no-matches')}</Badge>
                  )}
                </Table.Cell>
              )}
              {isLoading && (
                <Table.Cell>
                  <Skeleton w="100px" h="10px" />
                </Table.Cell>
              )}
              <Table.Cell>
                {isToday(new Date(list.owner.lastSeen), {
                  in: tz('America/Los_Angeles'),
                })
                  ? t('General.today')
                  : formatter.relativeTime(new Date(list.owner.lastSeen))}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

export default MatchTable;
