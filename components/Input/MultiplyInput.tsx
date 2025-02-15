import { NumberInput, NumberInputField } from '@chakra-ui/react';
import CustomNumberInput from './CustomNumber';
import { useEffect, useState } from 'react';

type MultiplyInputProps = {
  disableShortcuts?: boolean;
  onChange?: (val?: string) => void;
  onEnter?: (val?: string) => void;
  wrapperProps?: React.ComponentProps<typeof NumberInput>;
  inputProps?: React.ComponentProps<typeof NumberInputField>;
};

export const MultiplyInput = (props: MultiplyInputProps) => {
  const [purePrice, setPurePrice] = useState<string>();

  useEffect(() => {
    if (props.onChange) props.onChange(purePrice);
  }, [purePrice]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      props.onEnter?.(purePrice);
    }

    if (!purePrice || props.disableShortcuts) return;

    if (e.key.toLowerCase() === 'k') {
      setPurePrice(purePrice.toString() + '000');
    }

    if (e.key.toLowerCase() === 'm') {
      setPurePrice(purePrice.toString() + '000000');
    }

    if (e.key.toLowerCase() === 'b') {
      setPurePrice(purePrice.toString() + '000000000');
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
      onChange={(val) => setPurePrice(val)}
    />
  );
};
