import { NumberInput, NumberInputField } from '@chakra-ui/react';
import CustomNumberInput from './CustomNumber';
import { useState } from 'react';

type MultiplyInputProps = {
  disableShortcuts?: boolean;
  onChange?: (val?: string) => void;
  onEnter?: (val?: string) => void;
  wrapperProps?: React.ComponentProps<typeof NumberInput>;
  inputProps?: React.ComponentProps<typeof NumberInputField>;
};

export const MultiplyInput = (props: MultiplyInputProps) => {
  const [purePrice, setPurePrice] = useState<string>();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      props.onEnter?.(purePrice);
    }

    if (!purePrice || props.disableShortcuts) return;

    let newValue = purePrice;

    if (e.key.toLowerCase() === 'k') {
      newValue = purePrice.toString() + '000';
    }

    if (e.key.toLowerCase() === 'm') {
      newValue = purePrice.toString() + '000000';
    }

    if (e.key.toLowerCase() === 'b') {
      newValue = purePrice.toString() + '000000000';
    }

    if (newValue !== purePrice) {
      handleChange(newValue);
    }
  };

  const handleChange = (val?: string) => {
    if (!val) {
      setPurePrice(undefined);
      if (props.onChange) props.onChange(undefined);
      return;
    }
    const newValue = val.replace(/[^0-9]/g, '');
    if (newValue !== purePrice) {
      setPurePrice(newValue);
      if (props.onChange) props.onChange(newValue);
    }
  };

  return (
    <CustomNumberInput
      skipDebounce
      wrapperProps={{
        ...props.wrapperProps,
      }}
      inputProps={{
        textAlign: 'left',
        onKeyDown: handleKeyDown,
        ...props.inputProps,
      }}
      value={purePrice}
      onChange={(val) => handleChange(val)}
    />
  );
};
