import { VStack, NumberInput, Checkbox, Text, Input, Flex, Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { EditableItemCardProps } from './EditableItemCard';
import { ListItemInfo } from '../../types';

export type EditableFieldsProps = EditableItemCardProps & {
  handleItemInfoChange: (
    value: number | string,
    field:
      | 'amount'
      | 'capValue'
      | 'isHighlight'
      | 'isHidden'
      | 'order'
      | 'seriesStart'
      | 'seriesEnd'
  ) => void;
  itemInfo: ListItemInfo | undefined;
};

const fieldLabelProps = {
  fontSize: 'xs',
  px: 2,
  py: 1,
  bg: 'whiteAlpha.200',
  borderLeftRadius: 'md',
  whiteSpace: 'nowrap' as const,
};

const NumberField = ({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof NumberInput.Root>) => (
  <Flex align="stretch" w="100%">
    <Box {...fieldLabelProps}>{label}</Box>
    <NumberInput.Root flex={1} size="xs" variant="subtle" borderRightRadius="md" {...props}>
      <NumberInput.Input />
      <NumberInput.Control />
    </NumberInput.Root>
  </Flex>
);

const EditableFields = (props: EditableFieldsProps) => {
  const { item, isTrading, handleItemInfoChange, itemInfo, list } = props;

  const t = useTranslations();

  return (
    <VStack maxW="150px" gap={2} align="stretch">
      <NumberField
        label={t('General.quantity')}
        max={999}
        min={1}
        defaultValue={String(itemInfo?.amount ?? 1)}
        onValueChange={({ value }: { value: string }) =>
          handleItemInfoChange(Number(value || 1), 'amount')
        }
      />
      <NumberField
        label={t('General.order')}
        min={0}
        defaultValue={String(itemInfo?.order ?? 0)}
        onValueChange={({ value }: { value: string }) =>
          handleItemInfoChange(Number(value || 0), 'order')
        }
      />
      {item.type === 'nc' && isTrading && (
        <NumberField
          label={t('General.cap-value')}
          defaultValue={itemInfo?.capValue != null ? String(itemInfo.capValue) : undefined}
          min={0}
          max={99}
          onValueChange={({ value }: { value: string }) =>
            handleItemInfoChange(Number(value || 0), 'capValue')
          }
        />
      )}
      {list?.official && list.seriesType && (
        <>
          <Flex align="stretch" w="100%">
            <Box {...fieldLabelProps}>Start</Box>
            <Input
              flex={1}
              size="xs"
              type="date"
              variant="subtle"
              borderRightRadius="md"
              value={itemInfo?.seriesStart?.split('T')[0] || ''}
              onChange={(e) => handleItemInfoChange(e.target.value, 'seriesStart')}
            />
          </Flex>
          <Flex align="stretch" w="100%">
            <Box {...fieldLabelProps}>End</Box>
            <Input
              flex={1}
              size="xs"
              type="date"
              variant="subtle"
              borderRightRadius="md"
              value={itemInfo?.seriesEnd?.split('T')[0] || ''}
              onChange={(e) => handleItemInfoChange(e.target.value, 'seriesEnd')}
            />
          </Flex>
        </>
      )}
      <Checkbox.Root
        checked={!!itemInfo?.isHighlight}
        size="sm"
        onCheckedChange={(details) =>
          handleItemInfoChange(Number(details.checked === true), 'isHighlight')
        }
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          <Text fontSize="xs">{t('Lists.highlight')}?</Text>
        </Checkbox.Label>
      </Checkbox.Root>
      <Checkbox.Root
        checked={!!itemInfo?.isHidden}
        size="sm"
        onCheckedChange={(details) =>
          handleItemInfoChange(Number(details.checked === true), 'isHidden')
        }
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          <Text fontSize="xs">{t('Lists.hidden')}?</Text>
        </Checkbox.Label>
      </Checkbox.Root>
    </VStack>
  );
};

export default EditableFields;
