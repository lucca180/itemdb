'use client';

import { Box, Center, Flex, Heading, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { LuInfo } from 'react-icons/lu';
import type { ListContext } from '@types';
import { ItemList } from '@components/UserLists/ItemList';
import type { ListViewportProps } from '@components/UserLists/ListViewport';
import { EditableItemCard } from '@components/UserLists/EditableItemCard';
import {
  ListContextPopover,
  contextTextColor,
} from '@components/UserLists/Contexts/ListContextPopover';
import { ListContextGroupProvider } from '@components/UserLists/Contexts/ListContextsProvider';

/** Groups up to this size render their cards directly and can sit side by side. */
const SMALL_GROUP_MAX = 6;

type ListContextGroupsProps = Omit<ListViewportProps, 'activateSort' | 'editMode'> & {
  contexts: ListContext[];
};

/**
 * Main item grid grouped by context (view mode only). An item in several contexts shows up in
 * each of their groups; items without a context go last.
 */
export function ListContextGroups({ contexts, ...listProps }: ListContextGroupsProps) {
  const t = useTranslations();
  const { ids, itemInfo, items, showHidden } = listProps;

  const visibleIds = useMemo(
    () =>
      ids.filter((id) => {
        const info = itemInfo[id];
        return !!info && !!items[info.item_iid] && (!info.isHidden || showHidden);
      }),
    [ids, itemInfo, items, showHidden]
  );

  const groups = useMemo(() => {
    const grouped = new Set<number>();
    const byContext = contexts
      .map((context) => {
        const iids = new Set(context.itemIids);
        const groupIds = visibleIds.filter((id) => iids.has(itemInfo[id].item_iid));
        groupIds.forEach((id) => grouped.add(id));
        return { context, ids: groupIds };
      })
      .filter((group) => group.ids.length > 0);

    return { byContext, rest: visibleIds.filter((id) => !grouped.has(id)) };
  }, [contexts, visibleIds, itemInfo]);

  const renderItems = (groupIds: number[]) => {
    if (groupIds.length > SMALL_GROUP_MAX) {
      return <ItemList {...listProps} ids={groupIds} editMode={false} activateSort={false} />;
    }

    return (
      <Flex gap={[1, 3]} justifyContent="center" flexWrap="wrap">
        {groupIds.map((id) => (
          <EditableItemCard
            key={id}
            id={id}
            list={listProps.list}
            sortType={listProps.sortType}
            itemInfo={itemInfo[id]}
            item={items[itemInfo[id].item_iid]}
            isTrading={listProps.list?.purpose === 'trading'}
            showHidden={showHidden}
            onClick={listProps.onClick}
            onListAction={listProps.onListAction}
          />
        ))}
      </Flex>
    );
  };

  return (
    <Flex gap={3} flexWrap="wrap">
      {groups.byContext.map(({ context, ids: groupIds }) => (
        <Flex
          key={context.internal_id}
          flex={groupIds.length > SMALL_GROUP_MAX ? '1 1 100%' : '1 1 auto'}
          flexFlow="column"
          gap={3}
          p={3}
          pb={0}
          bg="blackAlpha.500"
          borderRadius="md"
          style={{ borderTop: `3px solid ${context.color}` }}
        >
          <Center>
            <ListContextPopover contexts={[context]}>
              <Flex
                as="button"
                alignItems="center"
                gap={2}
                px={2}
                py={1}
                borderRadius="md"
                cursor="help"
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                <Text fontWeight="bold" fontSize="lg">
                  {context.badgeText}
                </Text>
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color={contextTextColor(context.color)}
                  style={{ background: context.color }}
                >
                  <LuInfo size={12} strokeWidth={2.75} />
                </Box>
              </Flex>
            </ListContextPopover>
          </Center>
          <ListContextGroupProvider contextId={context.internal_id}>
            {renderItems(groupIds)}
          </ListContextGroupProvider>
        </Flex>
      ))}

      {groups.rest.length > 0 && (
        <Flex flex="1 1 100%" flexFlow="column" gap={3} pt={3}>
          <Heading size="md" textAlign="center">
            {t('Lists.contexts-other-items')}
          </Heading>
          {renderItems(groups.rest)}
        </Flex>
      )}
    </Flex>
  );
}
