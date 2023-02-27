import { NumberInput, NumberInputField } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const intl = new Intl.NumberFormat('en-US', { style: 'decimal' });

type Props = {
  value?: string;
  onChange?: (newValue: string) => void;
  inputProps?: any;
  wrapperProps?: any;
};

const format = (val: number | string) =>
  val || val === 0 ? intl.format(Number(val)) : '';
const parse = (val: string) =>
  val ? parseInt(val.replace(/[\.\,]+/g, '')) : '';

const CustomNumberInput = (props: Props) => {
  const [value, setValue] = useState<number | string>('');

  useEffect(() => {
    if (typeof props.value !== 'undefined' && props.value !== value)
      setValue(props.value);
    if (typeof props.value === 'undefined') setValue('');
  }, [props.value]);

  const onChange = (val: string) => {
    if (props.onChange) {
      if (val !== value)
        props.onChange(val || val === '0' ? val.replace(/[\.\,]+/g, '') : '');
    }

    if (typeof props.value === 'undefined') setValue(parse(val));
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
      <NumberInputField
        paddingEnd={1}
        paddingStart={1}
        textAlign="center"
        {...props.inputProps}
      />
      {/* <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper> */}
    </NumberInput>
  );
};

export default CustomNumberInput;
