import { Button, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { OnlyHiddenEmptyState as EmptyState } from '@app/[locale]/lists/[username]/[list_id]/listPageStateHelpers';

type OnlyHiddenEmptyStateProps = {
  state: EmptyState;
  /** Hidden rows read as collected on a checklist */
  isChecklist: boolean;
  onToggle: () => void;
};

export function OnlyHiddenEmptyState({ state, isChecklist, onToggle }: OnlyHiddenEmptyStateProps) {
  const t = useTranslations();
  const { showing, otherCount } = state;

  const getMessageKey = () => {
    if (showing === 'visible') return isChecklist ? 'empty-nothing-missing' : 'empty-all-hidden';
    return isChecklist ? 'empty-none-collected' : 'empty-none-hidden';
  };

  const getActionKey = () => {
    if (showing === 'visible') return isChecklist ? 'show-collected' : 'show-hidden';
    return isChecklist ? 'show-missing' : 'show-visible';
  };

  return (
    <Flex
      direction="column"
      alignItems="center"
      gap={3}
      px={4}
      py={8}
      borderRadius="md"
      bg="blackAlpha.300"
      textAlign="center"
    >
      <Text fontSize="sm" color="gray.300">
        {t(`Lists.${getMessageKey()}`, { count: otherCount })}
      </Text>
      {otherCount > 0 && (
        <Button
          size="sm"
          variant="subtle"
          onClick={onToggle}
          data-umami-event="list-only-hidden"
          data-umami-event-label="empty-state"
        >
          {t(`Lists.${getActionKey()}`)}
        </Button>
      )}
    </Flex>
  );
}
