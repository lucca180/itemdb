'use client';

import { ChangeEvent, useRef } from 'react';
import { NativeSelect } from '@chakra-ui/react';
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
      <label htmlFor="prefLang" style={{ display: 'none' }}>
        {t('General.select-language')}
      </label>
      <LocaleSelect defaultValue={locale} onChange={() => formRef.current?.requestSubmit()} />
    </form>
  );
}

export function LayoutLocalePages() {
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

  return <LocaleSelect defaultValue={currentLocale} onChange={changeLang} />;
}

const LocaleSelect = (props: { defaultValue: string; onChange: (value: string) => void }) => {
  return (
    <NativeSelect.Root size="xs" variant="subtle" flex="1" minW="120px" borderRadius="md" h="25px">
      <NativeSelect.Field
        id="prefLang"
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
  );
};
