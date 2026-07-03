'use client';

import dynamic from 'next/dynamic';
import { Badge, Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import type { ItemProcessDiffEntry } from '@utils/manualCheck/itemProcessDiff';
import { decodeHtmlEntities } from '@utils/text/decodeHtmlEntities';
import { DiffMethod } from 'react-diff-viewer-continued';

const ReactDiffViewer = dynamic(() => import('react-diff-viewer-continued'), {
  ssr: false,
  loading: () => <Skeleton height="60px" borderRadius="md" />,
});

const diffStyles = {
  variables: {
    dark: {
      diffViewerBackground: 'transparent',
      diffViewerColor: '#fff',
      addedBackground: '#1a4d3a',
      removedBackground: '#5c2b2b',
      wordAddedBackground: '#2d6a4f',
      wordRemovedBackground: '#9b2226',
      addedGutterBackground: '#1a4d3a',
      removedGutterBackground: '#5c2b2b',
      gutterBackground: 'rgba(0,0,0,0.2)',
      gutterBackgroundDark: 'rgba(0,0,0,0.2)',
      diffViewerTitleBackground: 'rgba(0,0,0,0.25)',
      diffViewerTitleColor: '#fff',
      diffViewerTitleBorderColor: 'rgba(255,255,255,0.1)',
    },
  },
  diffContainer: {
    minWidth: '0',
  },
};

type Props = {
  changes: ItemProcessDiffEntry[];
  conflictField: string | null;
};

function serializeForJson(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return decodeHtmlEntities(value);
  return value ?? null;
}

function buildSnapshot(changes: ItemProcessDiffEntry[], side: 'current' | 'incoming') {
  return Object.fromEntries(
    changes.map((change) => [
      change.field,
      serializeForJson(side === 'current' ? change.rawCurrent : change.rawIncoming),
    ])
  );
}

export function ManualCheckDiffView({ changes, conflictField }: Props) {
  if (changes.length === 0) return null;

  const conflictChange = changes.find((change) => change.isConflict);
  const otherChanges = changes.filter((change) => !change.isConflict);

  return (
    <Flex direction="column" gap={3} w="100%" textAlign="left">
      {conflictField && (
        <Text fontSize="sm" color="whiteAlpha.800">
          Resolve conflict on <b>{conflictField}</b> field
        </Text>
      )}
      {conflictChange && (
        <Box
          borderWidth="1px"
          borderColor="orange.400"
          borderRadius="md"
          overflow="hidden"
          bg="blackAlpha.400"
        >
          <Flex
            align="center"
            justify="space-between"
            px={3}
            py={2}
            bg="blackAlpha.300"
            borderBottomWidth="1px"
            borderColor="whiteAlpha.200"
          >
            <Text fontSize="sm" fontWeight="semibold" textTransform="capitalize">
              {conflictChange.field}
            </Text>
            <Badge colorPalette="orange" size="sm">
              Conflict
            </Badge>
          </Flex>
          <ReactDiffViewer
            oldValue={conflictChange.current}
            newValue={conflictChange.incoming}
            splitView={false}
            disableWordDiff={false}
            showDiffOnly={true}
            useDarkTheme={true}
            hideLineNumbers
            hideSummary
            styles={diffStyles}
          />
        </Box>
      )}

      {otherChanges.length > 0 && (
        <Box
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          borderRadius="md"
          overflow="hidden"
          bg="blackAlpha.400"
        >
          <Box
            px={3}
            py={2}
            bg="blackAlpha.300"
            borderBottomWidth="1px"
            borderColor="whiteAlpha.200"
          >
            <Text fontSize="sm" fontWeight="semibold">
              Other differences
            </Text>
          </Box>
          <ReactDiffViewer
            oldValue={buildSnapshot(otherChanges, 'current')}
            newValue={buildSnapshot(otherChanges, 'incoming')}
            compareMethod={DiffMethod.JSON}
            splitView={true}
            disableWordDiff={false}
            showDiffOnly={true}
            useDarkTheme={true}
            hideLineNumbers
            hideSummary
            leftTitle="Current"
            rightTitle="Incoming"
            styles={diffStyles}
          />
        </Box>
      )}
    </Flex>
  );
}
