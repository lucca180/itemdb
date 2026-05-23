/* eslint-disable react-hooks/preserve-manual-memoization */
import { NumberInput } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

const intl = new Intl.NumberFormat('en-US', { style: 'decimal' });

type CustomNumberRootProps = Omit<
  React.ComponentProps<typeof NumberInput.Root>,
  'disabled' | 'variant'
> & {
  disabled?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  variant?: 'outline' | 'subtle' | 'flushed' | 'filled';
};

type CustomNumberInputProps = Omit<React.ComponentProps<typeof NumberInput.Input>, 'variant'> & {
  variant?: string;
};

type Props = {
  value?: string;
  onChange?: (newValue: string) => void;
  inputProps?: CustomNumberInputProps;
  wrapperProps?: CustomNumberRootProps;
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

  const {
    disabled,
    isDisabled,
    placeholder: _placeholder,
    variant,
    ...wrapperProps
  } = props.wrapperProps ?? {};
  const { variant: _inputVariant, ...inputProps } = props.inputProps ?? {};

  return (
    <NumberInput.Root
      min={0}
      step={1}
      size="sm"
      onValueChange={({ value: nextValue }) => onChange(nextValue)}
      value={format(value)}
      variant={variant === 'filled' ? 'subtle' : (variant ?? 'subtle')}
      bg="whiteAlpha.200"
      disabled={disabled ?? isDisabled}
      {...wrapperProps}
    >
      <NumberInput.Control />
      <NumberInput.Input paddingEnd={1} paddingStart={1} textAlign="center" {...inputProps} />
    </NumberInput.Root>
  );
};

export default CustomNumberInput;
