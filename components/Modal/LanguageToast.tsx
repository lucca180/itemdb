import { Flex, useToast, Text, Button } from '@chakra-ui/react';
import { getCookies, setCookie } from 'cookies-next';
import alParser from 'accept-language-parser';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../utils/auth';
import axios from 'axios';

const VALID_LOCALES = ['en', 'pt'];

export const LanguageToast = () => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    checkLanguage();
  }, [router.isReady, authLoading]);

  const handleAction = async (action: 'dismiss' | 'change', prefLang: string) => {
    const { pathname, asPath, query } = router;

    if (action === 'dismiss') {
      toast.update('language-toast', {
        description: t('Layout.you-can-change-lang'),
        duration: 5000,
        isClosable: true,
      });

      prefLang = router.locale || 'en';

      setCookie('NEXT_LOCALE', prefLang, { expires: new Date('2030-01-01') });
      await saveLang(prefLang);
    } else {
      toast.close('language-toast');

      setCookie('NEXT_LOCALE', prefLang, { expires: new Date('2030-01-01') });
      await saveLang(prefLang);

      router.push({ pathname, query }, asPath, { locale: prefLang });
    }
  };

  const saveLang = async (prefLang: string) => {
    if (!user) return;
    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang: prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  const checkLanguage = () => {
    const sessionToast = sessionStorage.getItem('language-toast');
    if (sessionToast) return;

    const cookies = getCookies();

    if (cookies.NEXT_LOCALE || !cookies['idb_accept-language']) return;

    const prefLang =
      alParser.pick(VALID_LOCALES, cookies['idb_accept-language'], {
        loose: true,
      }) || 'en';

    if (!prefLang || router.locale === prefLang) return;

    toast({
      id: 'language-toast',
      title: prefLang === 'en' ? 'We also speak English' : 'Também falamos Português!',
      description: <ToastMsg prefLang={prefLang} handleAction={handleAction} />,
      duration: 10000,
      isClosable: true,
    });

    sessionStorage.setItem('language-toast', 'true');
  };

  return null;
};

type ToastMsgProps = {
  prefLang: string;
  handleAction: (action: 'dismiss' | 'change', prefLang: string) => void;
};

const ToastMsg = ({ prefLang, handleAction }: ToastMsgProps) => {
  if (prefLang === 'pt')
    return (
      <Flex flexFlow={'column'} gap={1}>
        <Text>Você pode trocar o idioma do itemdb, se quiser...</Text>
        <Flex gap={3}>
          <Button colorScheme="blackAlpha" onClick={() => handleAction('dismiss', prefLang)}>
            ✋ I speak English
          </Button>
          <Button colorScheme="blackAlpha" onClick={() => handleAction('change', prefLang)}>
            👍 Mudar para Português
          </Button>
        </Flex>
      </Flex>
    );
  else
    return (
      <Flex flexFlow={'column'} gap={1}>
        <Text>You can switch itemdb&apos;s language, if you wish</Text>
        <Flex gap={3}>
          <Button colorScheme="blackAlpha" onClick={() => handleAction('dismiss', prefLang)}>
            ✋ Eu falo Português
          </Button>
          <Button colorScheme="blackAlpha" onClick={() => handleAction('change', prefLang)}>
            👍 Switch to English
          </Button>
        </Flex>
      </Flex>
    );
};
