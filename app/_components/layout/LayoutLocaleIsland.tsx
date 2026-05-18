'use client';

import { Select } from '@chakra-ui/react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { setCookie } from 'cookies-next';
import { useAuth } from '@utils/auth';
import LanguageToast from '@components/Modal/LanguageToast';
import { getLocalizedPath } from './layoutUtils';

export function LayoutLocaleIsland() {
  const locale = useLocale();
  const { user } = useAuth();

  const saveLang = async (prefLang: string) => {
    setCookie('NEXT_LOCALE', prefLang, {
      expires: new Date('2030-01-01'),
      sameSite: 'none',
      secure: true,
    });

    if (!user) {
      return;
    }

    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  const changeLang = async (prefLang: string) => {
    const currentPath =
      typeof window === 'undefined'
        ? '/'
        : `${window.location.pathname}${window.location.search}${window.location.hash}`;

    await saveLang(prefLang);
    window.location.assign(getLocalizedPath(currentPath, prefLang));
  };

  return (
    <>
      <LanguageToast saveLang={saveLang} />
      <Select
        borderRadius="md"
        bg="whiteAlpha.200"
        size="xs"
        variant="filled"
        defaultValue={locale}
        flex="1"
        minW="120px"
        h="25px"
        onChange={(e) => void changeLang(e.target.value)}
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>
    </>
  );
}
