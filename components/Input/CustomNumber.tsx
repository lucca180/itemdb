/* eslint-disable react-hooks/preserve-manual-memoization */
import { NumberInput } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

type NumberInputVariant = React.ComponentProps<typeof NumberInput.Root>['variant'] | 'filled';
const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  useGrouping: true,
});

type CustomNumberRootProps = Omit<
  React.ComponentProps<typeof NumberInput.Root>,
  'disabled' | 'variant'
> & {
  disabled?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  variant?: NumberInputVariant;
};

type CustomNumberInputProps = React.ComponentProps<typeof NumberInput.Input>;

type Props = {
  value?: string;
  onChange?: (newValue: string) => void;
  inputProps?: CustomNumberInputProps;
  wrapperProps?: CustomNumberRootProps;
  skipDebounce?: boolean;
};

const normalizeValue = (val?: string) => (val ? val.replace(/[\.\,]+/g, '') : '');
const formatValue = (val?: string) => {
  const normalizedValue = normalizeValue(val);
  return normalizedValue ? numberFormatter.format(Number(normalizedValue)) : '';
};

const CustomNumberInput = (props: Props) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayValue(formatValue(props.value));
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
    const normalizedValue = normalizeValue(val);
    setDisplayValue(formatValue(normalizedValue));
    if (!props.skipDebounce) debouncedOnChange(normalizedValue);
    else props.onChange?.(normalizedValue);
  };

  const {
    disabled,
    isDisabled,
    placeholder: wrapperPlaceholder,
    variant,
    ...wrapperProps
  } = props.wrapperProps ?? {};
  const inputProps = props.inputProps ?? {};
  const resolvedVariant = variant === 'filled' ? 'subtle' : variant;

  return (
    <NumberInput.Root
      min={0}
      step={1}
      size="sm"
      formatOptions={{
        useGrouping: true,
        style: 'decimal',
      }}
      onValueChange={({ value: nextValue }) => onChange(nextValue)}
      value={displayValue}
      variant={resolvedVariant ?? 'subtle'}
      bg="whiteAlpha.100"
      disabled={disabled ?? isDisabled}
      {...wrapperProps}
    >
      <NumberInput.Control />
      <NumberInput.Input
        paddingEnd={1}
        paddingStart={1}
        placeholder={inputProps.placeholder ?? wrapperPlaceholder}
        textAlign="center"
        {...inputProps}
      />
    </NumberInput.Root>
  );
};

export default CustomNumberInput;
