'use client';

import { NativeSelect } from '@chakra-ui/react';
import { useRef } from 'react';

type LayoutLocaleSelectClientProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
};

export function LayoutLocaleSelectClient({ action, locale }: LayoutLocaleSelectClientProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <NativeSelect.Root
        borderRadius="md"
        bg="whiteAlpha.200"
        size="xs"
        variant="subtle"
        flex="1"
        minW="120px"
        h="25px"
        border="0"
        color="white"
      >
        <NativeSelect.Field
          name="prefLang"
          defaultValue={locale}
          onChange={() => formRef.current?.requestSubmit()}
          _hover={{ bg: 'whiteAlpha.300' }}
          _focusVisible={{
            bg: 'whiteAlpha.300',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
          }}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </form>
  );
}
