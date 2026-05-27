import { ActionBar, Button, Flex, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

type UnsavedChangesActionBarProps = {
  open: boolean;
  offsetBottom?: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export function UnsavedChangesActionBar({
  open,
  offsetBottom,
  onCancel,
  onSave,
}: UnsavedChangesActionBarProps) {
  const t = useTranslations();

  return (
    <ActionBar.Root
      open={open}
      placement="bottom"
      closeOnEscape={false}
      closeOnInteractOutside={false}
    >
      <Portal>
        <ActionBar.Positioner>
          <ActionBar.Content
            flexFlow={{ base: 'column', md: 'row' }}
            bg="gray.700"
            mb={offsetBottom ? { base: 20, md: 16 } : undefined}
          >
            <ActionBar.SelectionTrigger bg="blackAlpha.300">
              {t('General.you-have-unsaved-changes')}
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator display={{ base: 'none', md: 'block' }} />
            <Flex gap={2} justifyContent="center" flexWrap="wrap">
              <Button onClick={onSave} variant={'solid'} colorPalette="green" size="sm">
                {t('General.save-changes')}
              </Button>
              <Button onClick={onCancel} variant={'solid'} colorPalette="gray" size="sm">
                {t('General.cancel')}
              </Button>
            </Flex>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
