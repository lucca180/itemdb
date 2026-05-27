import { ActionBar, Button, Flex, IconButton, Menu, Portal } from '@chakra-ui/react';
import { SelectItemsCheckbox } from '@components/Input/SelectItemsCheckbox';
import type { ListItemInfo } from '@types';
import { useTranslations } from 'next-intl';
import { LuMenu, LuTrash, LuX } from 'react-icons/lu';

type SelectionAction = 'copy' | 'delete' | 'move';
type ToggleField = 'isHidden' | 'isHighlight';

type SelectedItemsActionBarProps = {
  selectedItems: ListItemInfo[];
  totalItems: number;
  canRemove: boolean;
  onSelectItems: (checkAll: boolean) => void;
  onClearSelection: () => void;
  onToggleField: (field: ToggleField, value: boolean) => void;
  onAction: (action: SelectionAction) => void;
};

export function SelectedItemsActionBar({
  selectedItems,
  totalItems,
  canRemove,
  onSelectItems,
  onClearSelection,
  onToggleField,
  onAction,
}: SelectedItemsActionBarProps) {
  const t = useTranslations();
  const allChecked = selectedItems.length === totalItems;
  const allHidden = selectedItems.every((item) => item.isHidden);
  const allHighlighted = selectedItems.every((item) => item.isHighlight);

  return (
    <ActionBar.Root open placement="bottom" closeOnInteractOutside={false}>
      <Portal>
        <ActionBar.Positioner>
          <ActionBar.Content bg="gray.700">
            <ActionBar.SelectionTrigger alignSelf="center" bg="blackAlpha.300" p={2}>
              <SelectItemsCheckbox
                size={{ base: 'xs', sm: 'sm' }}
                checked={selectedItems}
                allChecked={allChecked}
                onClick={onSelectItems}
              />
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator />
            <Flex gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                onClick={() => onAction('delete')}
                colorPalette="red"
                variant="solid"
                size="sm"
                display={{ base: 'none', md: 'inline-flex' }}
                disabled={!canRemove}
              >
                {t('Lists.delete-items')}
              </Button>
              <IconButton
                aria-label={t('Lists.delete-items')}
                onClick={() => onAction('delete')}
                colorPalette="red"
                variant="solid"
                size="sm"
                display={{ base: undefined, md: 'none' }}
                disabled={!canRemove}
              >
                <LuTrash />
              </IconButton>
              {canRemove && (
                <>
                  <Button
                    onClick={() => onAction('move')}
                    colorPalette="gray"
                    variant="solid"
                    size="sm"
                    display={{ base: 'none', md: 'inline-flex' }}
                  >
                    {t('Lists.move-items')}
                  </Button>
                </>
              )}
              <Menu.Root positioning={{ placement: 'top' }}>
                <Menu.Trigger asChild>
                  <IconButton
                    aria-label="More actions"
                    colorPalette="gray"
                    variant="solid"
                    size="sm"
                  >
                    <LuMenu />
                  </IconButton>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {canRemove && (
                        <Menu.Item
                          value="move-items"
                          onSelect={() => onAction('move')}
                          cursor="pointer"
                          _hover={{ bg: 'whiteAlpha.200' }}
                          display={{ base: undefined, md: 'none' }}
                        >
                          {t('Lists.move-items')}
                        </Menu.Item>
                      )}
                      <Menu.Item
                        value="copy-items"
                        onSelect={() => onAction('copy')}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      >
                        {t('Lists.copy-items')}
                      </Menu.Item>
                      <Menu.Item
                        value="toggle-hidden"
                        onSelect={() => onToggleField('isHidden', !allHidden)}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      >
                        {allHidden ? t('ItemPage.unmark-as-hidden') : t('ItemPage.mark-as-hidden')}
                      </Menu.Item>
                      <Menu.Item
                        value="toggle-highlight"
                        onSelect={() => onToggleField('isHighlight', !allHighlighted)}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      >
                        {allHighlighted
                          ? t('ItemPage.unmark-as-highlight')
                          : t('ItemPage.mark-as-highlight')}
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Flex>
            <ActionBar.Separator />
            <IconButton
              aria-label={t('General.cancel')}
              colorPalette="whiteAlpha"
              variant="subtle"
              size="sm"
              onClick={onClearSelection}
            >
              <LuX />
            </IconButton>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
