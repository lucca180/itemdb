import {
  VStack,
  InputGroup,
  InputLeftAddon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { EditableItemCardProps } from './EditableItemCard';
import { ListItemInfo } from '../../types';

export type EditableFieldsProps = EditableItemCardProps & {
  handleItemInfoChange: (
    value: number,
    field: 'amount' | 'capValue' | 'isHighlight' | 'order'
  ) => void;
  itemInfo: ListItemInfo | undefined;
};

const EditableFields = (props: EditableFieldsProps) => {
  const { id, item, isTrading, handleItemInfoChange, itemInfo } = props;

  const t = useTranslations();

  return (
    <VStack maxW="150px">
      <InputGroup size="xs">
        <InputLeftAddon children={t('General.quantity')} />
        <NumberInput
          max={999}
          min={1}
          variant="filled"
          defaultValue={itemInfo?.amount}
          onChange={(value) => handleItemInfoChange(Number(value || 1), 'amount')}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
      <InputGroup size="xs">
        <InputLeftAddon children={t('General.order')} />
        <NumberInput
          min={0}
          variant="filled"
          defaultValue={itemInfo?.order ?? 0}
          onChange={(value) => handleItemInfoChange(Number(value || 0), 'order')}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
      {item.isNC && isTrading && (
        <InputGroup size="xs">
          <InputLeftAddon children={t('General.cap-value')} />
          <NumberInput
            defaultValue={itemInfo?.capValue ?? undefined}
            min={0}
            max={99}
            variant="filled"
            onChange={(value) => handleItemInfoChange(Number(value || 0), 'capValue')}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </InputGroup>
      )}
      <Checkbox
        defaultChecked={itemInfo?.isHighlight}
        size="sm"
        onChange={(value) => props.onChange?.(id, Number(value.target.checked), 'isHighlight')}
      >
        <Text fontSize="xs">{t('Lists.highlight')}?</Text>
      </Checkbox>
      <Checkbox
        defaultChecked={itemInfo?.isHidden}
        size="sm"
        onChange={(value) => props.onChange?.(id, Number(value.target.checked), 'isHidden')}
      >
        <Text fontSize="xs">{t('Lists.hidden')}?</Text>
      </Checkbox>
    </VStack>
  );
};

export default EditableFields;
