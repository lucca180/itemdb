import { Checkbox, Text } from '@chakra-ui/react';

type Props = {
  allChecked?: boolean;
  checked?: any[];
  onClick?: (checkAll: boolean) => void;
  defaultText?: string;
};

export const SelectItemsCheckbox = (props: Props) => {
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
          ? `${checked?.length ?? 0} Items Selected`
          : `${defaultText}`}
      </Text>
    </Checkbox>
  );
};
