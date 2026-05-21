'use client';

import { Select } from '@chakra-ui/react';
import { useRef } from 'react';

type LayoutLocaleSelectClientProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
};

export function LayoutLocaleSelectClient({ action, locale }: LayoutLocaleSelectClientProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <Select
        name="prefLang"
        borderRadius="md"
        bg="whiteAlpha.200"
        size="xs"
        variant="filled"
        defaultValue={locale}
        flex="1"
        minW="120px"
        h="25px"
        border="0"
        color="white"
        _hover={{ bg: 'whiteAlpha.300' }}
        _focusVisible={{
          bg: 'whiteAlpha.300',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
        }}
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>
    </form>
  );
}
