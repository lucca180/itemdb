import { NumberInput, NumberInputField } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';

const intl = new Intl.NumberFormat('en-US', { style: 'decimal' });

type Props = {
  value?: string;
  onChange?: (newValue: string) => void;
  inputProps?: any;
  wrapperProps?: any;
};

const format = (val: number | string) => (val || val === 0 ? intl.format(Number(val)) : '');
const parse = (val: string) => (val ? parseInt(val.replace(/[\.\,]+/g, '')) : '');

const CustomNumberInput = (props: Props) => {
  const [value, setValue] = useState<number | string>('');

  useEffect(() => {
    const propsVal = props.value ?? '';

    if (typeof propsVal !== 'undefined' && propsVal !== value) setValue(propsVal);
    if (typeof propsVal === 'undefined') setValue('');
  }, [props.value]);

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      props.onChange?.(newValue);
    }, 250),
    [props.onChange]
  );

  const onChange = (val: string) => {
    const parsedVal = val || val === '0' ? val.replace(/[\.\,]+/g, '') : '';
    setValue(parse(val));
    debouncedOnChange(parsedVal);
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
    </NumberInput>
  );
};

export default CustomNumberInput;
