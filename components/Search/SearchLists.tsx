import { CloseIcon, SearchIcon } from '@chakra-ui/icons';
import {
  InputGroup,
  IconButton,
  Input,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';

type Props = {
  onChange: (search: string) => void;
};

export const SearchList = (props: Props) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const setFocus = () => {
    inputRef.current?.focus();
  };

  const captureKey = (e: KeyboardEvent) => {
    if (e.key === 'F3' || (e.ctrlKey && e.key === 'f')) {
      e.preventDefault();
      setFocus();
    }

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
    setSearch(e.target.value);
    props.onChange(e.target.value);
  };

  const reset = () => {
    setSearch('');
    props.onChange('');
  };

  return (
    <InputGroup w="auto" minW="40px" bg="whiteAlpha.200" borderRadius={'md'}>
      <InputLeftElement>
        <IconButton
          onClick={setFocus}
          aria-label="Search list"
          icon={<SearchIcon />}
          variant="ghost"
        />
      </InputLeftElement>

      <Input
        variant={'solid'}
        bg="transparent"
        maxW="175px"
        fontSize={'sm'}
        onChange={onChange}
        value={search}
        w={search ? '175px' : '0'}
        p={search ? undefined : 0}
        ref={inputRef}
        transition="width 0.5s ease"
        _focus={{
          w: '175px',
          pl: search ? undefined : 10,
        }}
      />

      {search && (
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
