import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Th,
  Thead,
  Badge,
  Link,
  Skeleton,
  Text,
} from '@chakra-ui/react';
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
    <TableContainer
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
      overflowX="auto"
      overflowY="auto"
    >
      <Table h="100%" variant="striped" colorScheme="gray" size="sm">
        <Thead>
          <Tr>
            <Th>{t('ItemPage.list-name')}</Th>
            <Th>{t('ItemPage.owner')}</Th>
            {matches && <Th>{t('ItemPage.match')}</Th>}
            <Th>{t('ItemPage.last-seen')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {!data.length && (
            <Tr>
              <Td colSpan={4} textAlign="center">
                {t('ItemPage.no-lists-found')} :(
                <br />
                <Text fontSize={'xs'} mt={2} color="whiteAlpha.600">
                  {t.rich('Lists.import-adv-tip', {
                    Link: (chunks) => (
                      <Link color="whiteAlpha.800" href="/lists/import">
                        {chunks}
                      </Link>
                    ),
                  })}
                </Text>
              </Td>
            </Tr>
          )}
          {sortedData.map((list) => (
            <Tr key={list.internal_id}>
              <Td maxW="200px" overflow="hidden" textOverflow="ellipsis">
                <MainLink
                  href={`/lists/${list.owner.username}/${list.slug ?? list.internal_id}`}
                  trackEvent="match-table"
                  trackEventLabel="list-name"
                >
                  {list.name}
                </MainLink>
              </Td>
              <Td>
                <MainLink
                  href={`/lists/${list.owner.username}`}
                  trackEvent="match-table"
                  trackEventLabel="owner-username"
                >
                  {list.owner.username}
                </MainLink>
              </Td>
              {!isLoading && matches && (
                <Td>
                  {matches[list.owner.username ?? '']?.length && (
                    <Badge colorScheme="green">
                      {matches[list.owner.username ?? '']?.length || 'none'}{' '}
                      {t('General.items').toLowerCase()}{' '}
                      {type === 'seeking' ? t('General.they') : t('General.you')}{' '}
                      {t('ItemPage.can-offer')}
                    </Badge>
                  )}
                  {!matches[list.owner.username ?? '']?.length && (
                    <Badge>{t('ItemPage.no-matches')}</Badge>
                  )}
                </Td>
              )}
              {isLoading && (
                <Td>
                  <Skeleton w="100px" h="10px" />
                </Td>
              )}
              <Td>
                {isToday(new Date(list.owner.lastSeen), {
                  in: tz('America/Los_Angeles'),
                })
                  ? t('General.today')
                  : formatter.relativeTime(new Date(list.owner.lastSeen))}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default MatchTable;
