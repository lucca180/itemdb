import { Flex, Text, Button } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { getCookies } from 'cookies-next';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isValidLocale, type AppLocale } from '@utils/locales';
import { usePathname, useRouter } from '@i18n/navigation';

export type LanguageToastProps = {
  saveLang: (prefLang: string) => Promise<void>;
};

const LanguageToast = (props: LanguageToastProps) => {
  const { saveLang } = props;
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleAction = async (action: 'dismiss' | 'change', prefLang: string) => {
    if (action === 'dismiss') {
      toast.update('language-toast', {
        id: 'language-toast',
        description: t('Layout.you-can-change-lang'),
        duration: 5000,
        isClosable: true,
      });

      prefLang = getLocaleFromPath(window.location.pathname);

      await saveLang(prefLang);
    } else {
      toast.close('language-toast');

      await saveLang(prefLang);
      router.replace(pathname, { locale: prefLang as AppLocale });
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
      if (isValidLocale(lang)) {
        prefLang = lang;
        break;
      }
    }

    if (!prefLang || locale === prefLang) return;

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
    checkLanguage();
  }, []);

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
        <Flex gap={2} flexFlow={'column'}>
          <Button
            colorPalette="gray"
            variant="solid"
            size="sm"
            onClick={() => handleAction('dismiss', prefLang)}
          >
            ✋ I speak English
          </Button>
          <Button
            colorPalette="gray"
            variant="solid"
            size="sm"
            onClick={() => handleAction('change', prefLang)}
          >
            👍 Mudar para Português
          </Button>
        </Flex>
      </Flex>
    );
  else
    return (
      <Flex flexFlow={'column'} gap={1}>
        <Text>You can switch itemdb&apos;s language, if you wish</Text>
        <Flex gap={2} flexFlow={'column'}>
          <Button
            colorPalette="gray"
            variant="solid"
            size="sm"
            onClick={() => handleAction('dismiss', prefLang)}
          >
            ✋ Eu falo Português
          </Button>
          <Button
            colorPalette="gray"
            variant="solid"
            size="sm"
            onClick={() => handleAction('change', prefLang)}
          >
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
