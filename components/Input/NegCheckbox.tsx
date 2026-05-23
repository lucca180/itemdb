/* eslint-disable  */
import { Checkbox } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  value?: string;
  checklist?: string[];
  disabled?: boolean;
  onChange?: (newValue: string) => void;
};

const NegCheckbox = (props: Props) => {
  const [isChecked, setValue] = useState(false);
  const [isIndefinite, setIsIndefinite] = useState(false);
  const checkedState = props.disabled ? false : isIndefinite ? 'indeterminate' : isChecked;

  useEffect(() => {
    if (!props.checklist || !props.value) return;

    const checklist = props.checklist.map((i) => i.toLowerCase());

    if (checklist.includes(props.value.toLowerCase())) setValue(true);
    else if (checklist?.includes(`!${props.value.toLowerCase()}`)) {
      setValue(true);
      setIsIndefinite(true);
    } else {
      setValue(false);
      setIsIndefinite(false);
    }
  }, [props.value, props.checklist]);

  const handleChange = () => {
    if (props.disabled) return;
    if (isChecked && !isIndefinite) {
      // setIsIndefinite(true);
      // setValue(true);
      if (props.onChange) props.onChange(`!${props.value}`);
    } else if (isChecked && isIndefinite) {
      // setValue(false);
      // setIsIndefinite(false);
      if (props.onChange) props.onChange('');
    } else {
      // setValue(true);
      // setIsIndefinite(false);
      if (props.onChange && props.value) props.onChange(props.value);
    }
  };

  return (
    <Checkbox.Root
      checked={checkedState}
      colorPalette={isIndefinite ? 'red' : undefined}
      onCheckedChange={handleChange}
      value={props.value}
      disabled={props.disabled}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>{props.children}</Checkbox.Label>
    </Checkbox.Root>
  );
};

export default NegCheckbox;
