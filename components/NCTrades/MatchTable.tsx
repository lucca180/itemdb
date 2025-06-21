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
import { formatDistanceToNow, isToday } from 'date-fns';
import NextLink from 'next/link';
import React from 'react';
import { UserList } from '../../types';
import { useTranslations } from 'next-intl';

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
  isLoading?: boolean;
};

const MatchTable = (props: Props) => {
  const t = useTranslations();
  const { data, matches, type, isLoading } = props;
  const sortedData = data.sort(
    (a, b) => new Date(b.owner.lastSeen).getTime() - new Date(a.owner.lastSeen).getTime()
  );

  return (
    <TableContainer
      minH={{ base: 100, md: 100 }}
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
                      <Link color="whiteAlpha.800" href="/lists/import?utm_content=import-tip">
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
              <Td>
                <Link
                  as={NextLink}
                  href={`/lists/${list.owner.username}/${list.slug ?? list.internal_id}`}
                >
                  {list.name}
                </Link>
              </Td>
              <Td>
                <Link as={NextLink} href={`/lists/${list.owner.username}`}>
                  {list.owner.username}
                </Link>
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
                {isToday(new Date(list.owner.lastSeen))
                  ? t('General.today')
                  : formatDistanceToNow(new Date(list.owner.lastSeen), { addSuffix: true })}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default MatchTable;
