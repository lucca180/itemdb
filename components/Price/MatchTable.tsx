import { Table, TableContainer, Tbody, Td, Tr, Th, Thead, Badge } from '@chakra-ui/react';
import { formatDistanceToNow, isToday } from 'date-fns';
import Link from 'next/link';
import React from 'react';
import { UserList } from '../../types';

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
};

const MatchTable = (props: Props) => {
  const { data, matches, type } = props;
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
            <Th>List Name</Th>
            <Th>Owner</Th>
            {matches && <Th>Match</Th>}
            <Th>Last Seen</Th>
          </Tr>
        </Thead>
        <Tbody>
          {!data.length && (
            <Tr>
              <Td colSpan={4} textAlign="center">
                No lists found :(
              </Td>
            </Tr>
          )}
          {sortedData.map((list) => (
            <Tr key={list.internal_id}>
              <Td>
                <Link href={`/lists/${list.owner.username}/${list.internal_id}`}>{list.name}</Link>
              </Td>
              <Td>
                <Link href={`/lists/${list.owner.username}`}>{list.owner.username}</Link>
              </Td>
              {matches && (
                <Td>
                  {matches[list.owner.username ?? '']?.length && (
                    <Badge colorScheme="green">
                      {matches[list.owner.username ?? '']?.length || 'none'} items{' '}
                      {type === 'seeking' ? 'they' : 'you'} can offer
                    </Badge>
                  )}
                  {!matches[list.owner.username ?? '']?.length && <Badge>no matches</Badge>}
                </Td>
              )}
              <Td>
                {isToday(new Date(list.owner.lastSeen))
                  ? 'Today'
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
