import { Checkbox, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

type Props = {
  allChecked?: boolean;
  checked?: any[];
  onClick?: (checkAll: boolean) => void;
  defaultText?: string;
};

export const SelectItemsCheckbox = (props: Props) => {
  const t = useTranslations();
  const { allChecked, checked, onClick, defaultText } = props;
  return (
    <Checkbox
      colorScheme={'gray'}
      isChecked={!!checked?.length}
      isIndeterminate={!!checked?.length && !allChecked}
      onChange={() => onClick?.(!allChecked)}
    >
      <Text fontSize={{ base: 'sm' }}>
        {!defaultText || checked?.length
          ? t('Button.items-selected', { items: checked?.length ?? 0 })
          : `${defaultText}`}
      </Text>
    </Checkbox>
  );
};
