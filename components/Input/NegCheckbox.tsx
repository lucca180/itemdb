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

  useEffect(() => {
    if (!props.checklist || !props.value) return;

    if (props.checklist?.includes(props.value)) setValue(true);
    else if (props.checklist?.includes(`!${props.value}`)) {
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
    <Checkbox
      onChange={handleChange}
      colorScheme={isIndefinite ? 'red' : undefined}
      isIndeterminate={!props.disabled && isIndefinite}
      isChecked={!props.disabled && isChecked}
      value={props.value}
      disabled={props.disabled}
    >
      {props.children}
    </Checkbox>
  );
};

export default NegCheckbox;
