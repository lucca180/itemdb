'use client';

import { ChangeEvent, useId, useRef } from 'react';
import { NativeSelect, VisuallyHidden } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import axios from 'axios';
import { setCookie } from 'cookies-next';
import { useAuth } from '@utils/auth';
import { usePathname, useRouter } from '@i18n/navigation';
import type { AppLocale } from '@utils/locales';

type LayoutLocaleSelectProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
};

export function LayoutLocaleSelect({ action, locale }: LayoutLocaleSelectProps) {
  const t = useTranslations();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <LocaleSelect
        defaultValue={locale}
        label={t('General.select-language')}
        onChange={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
}

export function LayoutLocalePages() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const intlLocale = useLocale();
  const currentLocale = intlLocale ?? 'en';
  const { user } = useAuth();

  const saveLang = async (prefLang: string) => {
    setCookie('NEXT_LOCALE', prefLang, {
      expires: new Date('2030-01-01'),
      sameSite: 'none',
      secure: true,
    });
    if (!user) return;
    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  const changeLang = async (prefLang: string) => {
    await saveLang(prefLang);
    router.replace(pathname, { locale: prefLang as AppLocale });
  };

  return (
    <LocaleSelect
      defaultValue={currentLocale}
      label={t('General.select-language')}
      onChange={changeLang}
    />
  );
}

const LocaleSelect = (props: {
  defaultValue: string;
  label: string;
  onChange: (value: string) => void;
}) => {
  const selectId = useId();

  return (
    <>
      <VisuallyHidden asChild>
        <label htmlFor={selectId}>{props.label}</label>
      </VisuallyHidden>
      <NativeSelect.Root
        size="xs"
        variant="subtle"
        flex="1"
        minW="120px"
        borderRadius="md"
        h="25px"
      >
        <NativeSelect.Field
          id={selectId}
          name="prefLang"
          h="25px"
          defaultValue={props.defaultValue}
          bg="whiteAlpha.200"
          onChange={(e: ChangeEvent<HTMLSelectElement>) => props.onChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </>
  );
};
