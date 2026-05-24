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
    <Checkbox.Root
      colorPalette="whiteAlpha"
      checked={checked?.length ? (!allChecked ? 'indeterminate' : true) : false}
      onCheckedChange={() => onClick?.(!allChecked)}
      cursor="pointer"
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control borderColor="whiteAlpha.300" cursor="pointer" />
      <Checkbox.Label>
        <Text fontSize={{ base: 'xs', md: 'sm' }}>
          {!defaultText || checked?.length
            ? t('Button.items-selected', { items: checked?.length ?? 0 })
            : `${defaultText}`}
        </Text>
      </Checkbox.Label>
    </Checkbox.Root>
  );
};
