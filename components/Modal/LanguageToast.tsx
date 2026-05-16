import { Flex, useToast, Text, Button } from '@chakra-ui/react';
import { getCookies } from 'cookies-next';
import { useRouter } from 'next/compat/router';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const VALID_LOCALES = ['en', 'pt'];

export type LanguageToastProps = {
  saveLang: (prefLang: string) => Promise<void>;
};

const LanguageToast = (props: LanguageToastProps) => {
  const { saveLang } = props;
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();

  const handleAction = async (action: 'dismiss' | 'change', prefLang: string) => {
    const pathname = router?.pathname ?? window.location.pathname;
    const asPath =
      router?.asPath ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const query = router?.query ?? {};

    if (action === 'dismiss') {
      toast.update('language-toast', {
        description: t('Layout.you-can-change-lang'),
        duration: 5000,
        isClosable: true,
      });

      prefLang = router?.locale || getLocaleFromPath(asPath);

      await saveLang(prefLang);
    } else {
      toast.close('language-toast');

      await saveLang(prefLang);
      if (router) router.push({ pathname, query }, asPath, { locale: prefLang });
      else window.location.assign(getLocalizedPath(asPath, prefLang));
    }
  };

  const checkLanguage = async () => {
    const sessionToast = sessionStorage.getItem('language-toast');
    if (sessionToast) return;

    const cookies = await getCookies();
    const languages = [...new Set(navigator.languages.map((lang) => lang.split('-')[0]))];

    if (!cookies || cookies.NEXT_LOCALE || !languages) return;

    let prefLang = 'en';

    for (const lang of languages) {
      if (VALID_LOCALES.includes(lang)) {
        prefLang = lang;
        break;
      }
    }

    if (!prefLang || (router?.locale ?? getLocaleFromPath(window.location.pathname)) === prefLang)
      return;

    toast({
      id: 'language-toast',
      title: prefLang === 'en' ? 'We also speak English' : 'Também falamos Português!',
      description: <ToastMsg prefLang={prefLang} handleAction={handleAction} />,
      duration: 10000,
      isClosable: true,
    });

    sessionStorage.setItem('language-toast', 'true');
  };

  useEffect(() => {
    if (router && !router.isReady) return;

    checkLanguage();
  }, [router?.isReady]);

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

export default LanguageToast;

function getLocaleFromPath(path: string) {
  return path.startsWith('/pt/') || path === '/pt' ? 'pt' : 'en';
}

function stripLocalePrefix(path: string) {
  return path.replace(/^\/pt(?=\/|$)/, '') || '/';
}

function getLocalizedPath(path: string, locale: string) {
  const normalizedPath = stripLocalePrefix(path);
  if (locale === 'pt') return `/pt${normalizedPath === '/' ? '' : normalizedPath}`;
  return normalizedPath;
}
