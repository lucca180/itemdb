import { CloseIcon } from '@chakra-ui/icons';
import {
  InputGroup,
  IconButton,
  Input,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { MdOutlineAttachMoney } from 'react-icons/md';

type Props = {
  onChange: (number: number | undefined) => void;
};

const intl = new Intl.NumberFormat();

const format = (val: number | string | undefined) =>
  val || val === 0 ? intl.format(Number(val)) : '';
const parse = (val: string) => (val ? parseInt(val.replace(/[\.\,]+/g, '')) : '');

export const CollapseNumber = (props: Props) => {
  const t = useTranslations();
  const [value, setVal] = useState<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  const setFocus = () => {
    inputRef.current?.focus();
  };

  const captureKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      reset();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', captureKey);

    return () => {
      window.removeEventListener('keydown', captureKey);
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val && isNaN(parse(val) || 0)) return;

    setVal(parse(val) || undefined);

    if (!isNaN(Number(e.target.value))) props.onChange(parse(val) || undefined);
  };

  const reset = () => {
    setVal(undefined);
    props.onChange(undefined);
  };

  return (
    <InputGroup w="auto" minW="40px" bg="whiteAlpha.200" borderRadius={'md'}>
      <InputLeftElement>
        <IconButton
          onClick={setFocus}
          aria-label="Search list"
          icon={<MdOutlineAttachMoney />}
          variant="ghost"
        />
      </InputLeftElement>

      <Input
        // type="number"
        variant={'solid'}
        bg="transparent"
        maxW="175px"
        placeholder={t('General.min-profit')}
        fontSize={'sm'}
        onChange={onChange}
        value={format(value)}
        w={value ? '175px' : '0'}
        p={value ? undefined : 0}
        ref={inputRef}
        transition="width 0.5s ease"
        _placeholder={{
          color: 'transparent',
        }}
        _focus={{
          w: '175px',
          pl: value ? undefined : 10,
          _placeholder: {
            color: 'whiteAlpha.500',
          },
        }}
      />

      {value && (
        <InputRightElement>
          <IconButton
            onClick={reset}
            size="xs"
            aria-label="Clear search"
            icon={<CloseIcon boxSize={'8px'} />}
            variant="ghost"
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
};
