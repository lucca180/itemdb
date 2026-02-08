/* eslint-disable react-hooks/preserve-manual-memoization */
import { NumberInput, NumberInputField } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

const intl = new Intl.NumberFormat('en-US', { style: 'decimal' });

type Props = {
  value?: string;
  onChange?: (newValue: string) => void;
  inputProps?: React.ComponentProps<typeof NumberInputField>;
  wrapperProps?: React.ComponentProps<typeof NumberInput>;
  skipDebounce?: boolean;
};

const format = (val: number | string) => (val || val === 0 ? intl.format(Number(val)) : '');
const parse = (val: string) => (val ? parseInt(val.replace(/[\.\,]+/g, '')) : '');

const CustomNumberInput = (props: Props) => {
  const [value, setValue] = useState<number | string>('');

  useEffect(() => {
    const propsVal = props.value ?? '';

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof propsVal !== 'undefined' && propsVal !== value) setValue(propsVal);
    if (typeof propsVal === 'undefined') setValue('');
  }, [props.value]);

  const debouncedOnChange = useMemo(() => {
    return debounce((newValue: string) => {
      props.onChange?.(newValue);
    }, 250);
  }, [props.onChange]);

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const onChange = (val: string) => {
    const parsedVal = val || val === '0' ? val.replace(/[\.\,]+/g, '') : '';
    setValue(parse(val));
    if (!props.skipDebounce) debouncedOnChange(parsedVal);
    else props.onChange?.(parsedVal);
  };

  return (
    <NumberInput
      min={0}
      step={1}
      size="sm"
      onChange={onChange}
      value={format(value)}
      variant="filled"
      bg={'whiteAlpha.200'}
      {...props.wrapperProps}
    >
      <NumberInputField paddingEnd={1} paddingStart={1} textAlign="center" {...props.inputProps} />
    </NumberInput>
  );
};

export default CustomNumberInput;
