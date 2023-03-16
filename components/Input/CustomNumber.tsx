import { NumberInput, NumberInputField } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';

const intl = new Intl.NumberFormat('en-US', { style: 'decimal' });

type Props = {
  value?: string[];
  index: 0 | 1;
  onChange?: (newValue: string[]) => void;
  inputProps?: any;
  wrapperProps?: any;
};

const format = (val: number | string) => (val || val === 0 ? intl.format(Number(val)) : '');
const parse = (val: string) => (val ? parseInt(val.replace(/[\.\,]+/g, '')) : '');

const CustomNumberInput = (props: Props) => {
  const [value, setValue] = useState<number | string>('');

  useEffect(() => {
    const propsVal = props.value?.[props.index] ?? '';

    if (typeof propsVal !== 'undefined' && propsVal !== value) setValue(propsVal);
    if (typeof propsVal === 'undefined') setValue('');
  }, [props.value]);

  const debouncedOnChange = useCallback(
    debounce((newValue: string[]) => props.onChange?.(newValue), 250),
    [props.onChange]
  );

  const onChange = (val: string) => {
    const parsedVal = val || val === '0' ? val.replace(/[\.\,]+/g, '') : '';
    const newValue = [...(props.value ?? ['', ''])];
    newValue[props.index] = parsedVal;
    debouncedOnChange(newValue);
    setValue(parse(val));
  };

  return (
    <NumberInput
      min={0}
      step={1}
      size="sm"
      onChange={onChange}
      value={format(value)}
      {...props.wrapperProps}
    >
      <NumberInputField paddingEnd={1} paddingStart={1} textAlign="center" {...props.inputProps} />
      {/* <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper> */}
    </NumberInput>
  );
};

export default CustomNumberInput;
