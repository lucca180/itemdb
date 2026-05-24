import { CloseIcon, SearchIcon } from '@utils/theme/chakraIcons';
import { InputGroup, IconButton, Input } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';

type Props = {
  onChange: (search: string) => void;
  disabled?: boolean;
};

export const SearchList = (props: Props) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const setFocus = () => {
    inputRef.current?.focus();
  };

  const reset = () => {
    setSearch('');
    props.onChange('');
  };

  const captureKey = (e: KeyboardEvent) => {
    if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key === 'f')) {
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

  return (
    <InputGroup
      w="auto"
      minW="40px"
      bg="whiteAlpha.200"
      borderRadius={'md'}
      startElement={
        <IconButton
          onClick={setFocus}
          aria-label="Search list"
          variant="ghost"
          disabled={props.disabled}
          size="sm"
        >
          <SearchIcon />
        </IconButton>
      }
      endElement={
        search ? (
          <IconButton onClick={reset} size="xs" aria-label="Clear search" variant="ghost">
            <CloseIcon boxSize={'8px'} />
          </IconButton>
        ) : undefined
      }
    >
      <Input
        variant={'subtle'}
        bg="transparent"
        maxW="175px"
        fontSize={'sm'}
        onChange={onChange}
        value={search}
        w={search ? '175px' : '0'}
        p={search ? undefined : 0}
        ref={inputRef}
        transition="width 0.5s ease"
        disabled={props.disabled}
        _focus={{
          w: '175px',
          pl: search ? undefined : 10,
        }}
      />
    </InputGroup>
  );
};
