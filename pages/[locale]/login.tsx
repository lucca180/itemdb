import {
  getLocaleStaticPaths,
  getPageRouterHref,
  isLocalizableHref,
  resolvePageLocale,
} from '@utils/locales';
import { Center, Flex, Field, Input, Text, Spinner, Button, useDisclosure } from '@chakra-ui/react';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@components/Layout';
import { useRouter } from 'next/router';
import Image from 'next/image';
import logoIcon from '@assets/logo_white.svg';
import axios from 'axios';
import { useAuth } from '@utils/auth';
import LoginModal from '@components/Modal/LoginModal';
import { User } from '@types';
import { useTranslations } from 'next-intl';
import { loadTranslation } from '@utils/load-translation';

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveLoginRedirect(
  router: ReturnType<typeof useRouter>,
  redirectTo: string | undefined
) {
  const path = decodeURIComponent(redirectTo ?? '/');
  if (!isLocalizableHref(path)) return path;
  return getPageRouterHref(router, path);
}

const LoginPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needInfo, setNeedInfo] = useState<boolean>(false);
  const [neopetsUser, setNeopetsUser] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const { user, authLoading, setUser } = useAuth();
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  const init = async () => {
    setIsLoading(true);
    const redirectTo = (router.query.redirect as string | undefined) ?? '/';

    const urlToken = router.query.token as string | undefined;
    const urlEmail = router.query.email as string | undefined;

    if (urlToken && urlEmail && !user) {
      try {
        const userRes = await axios.post('/api/auth/login', {
          token: urlToken,
          email: urlEmail,
        });

        const userData = userRes.data as User;

        if (!userData.neopetsUser || !userData.username) {
          setNeopetsUser(userData.neopetsUser || '');
          setUsername(userData.username || '');
          setIsLoading(false);
          return setNeedInfo(true);
        }

        setUser(userData);
        router.replace(resolveLoginRedirect(router, redirectTo));
      } catch (e: any) {
        setError(e.response?.data?.error ?? e.message);
        setIsLoading(false);
      }
    } else if (user) {
      if (!user.neopetsUser || !user.username) {
        setNeopetsUser(user.neopetsUser || '');
        setUsername(user.username || '');
        setIsLoading(false);
        return setNeedInfo(true);
      }

      router.replace(resolveLoginRedirect(router, redirectTo));
    } else onOpen();
  };

  useEffect(() => {
    if (!router.isReady || authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [router.isReady, authLoading]);

  const doConfirm = () => {
    if (!email.match(mailRegex)) {
      setError(t('Login.invalid-email-address'));
      return;
    }

    init();
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const saveChanges = async () => {
    const redirectTo = (router.query.redirect as string | undefined) ?? '/';

    setError('');
    if (!neopetsUser || !username) {
      setError(t('Login.please-fill-all-fields'));
      return;
    }

    if (!neopetsUser.match(/^[a-zA-Z0-9_]+$/) || !username.match(/^[a-zA-Z0-9_]+$/)) {
      setError(t('Login.only-letters-numbers'));
      return;
    }

    setIsLoading(true);

    if (!(await checkUsername())) {
      setIsLoading(false);
      setError(t('Login.username-already-taken'));
      return;
    }

    try {
      const userRes = await axios.post('/api/auth/alterUser', {
        neopetsUser: neopetsUser,
        username: username,
      });

      const userData = userRes.data as User;

      if (!userData.neopetsUser || !userData.username) {
        setIsLoading(false);
        return setNeedInfo(true);
      }

      setUser(userData);

      router.replace(resolveLoginRedirect(router, redirectTo));
    } catch (e: any) {
      setError(e.message);
      console.error(error);
    }
  };

  const closeLogin = () => {
    onClose();
    const redirectTo = (router.query.redirect as string | undefined) ?? '/';
    router.replace(resolveLoginRedirect(router, redirectTo));
  };

  const checkUsername = async (): Promise<boolean> => {
    if (!username) return false;
    if (!username.match(/^[a-zA-Z0-9_]+$/)) return false;

    try {
      const res = await axios.get(`/api/v1/users/${username}`);
      if (res.data) return false;
      else return true;
    } catch (e: any) {
      setError(e.message);
      console.error(error);
      return false;
    }
  };

  return (
    <>
      <LoginModal isOpen={isOpen} onClose={closeLogin} />
      <Center h="80vh" flexFlow="column">
        {isLoading && !error && <Spinner size="lg" />}
        {isLoading && !!error && (
          <Text mt={4} color="red.400" textAlign="center">
            {error}
          </Text>
        )}

        {!isLoading && !needInfo && (
          <Flex flexFlow="column" gap={4} justifyContent="center" alignItems="center">
            <Image src={logoIcon} alt="itemdb logo" width={300} quality={100} />
            <Text mt={4} textAlign="center">
              {t('Login.please-confirm-your-email-address')}
            </Text>
            <Field.Root invalid={!!error}>
              <Input
                placeholder={t('General.email-address')}
                type="email"
                value={email}
                onChange={onEmailChange}
              />
            </Field.Root>
            <Button onClick={doConfirm}>{t('General.continue')}</Button>
          </Flex>
        )}

        {!isLoading && needInfo && (
          <Flex flexFlow="column" gap={4} justifyContent="center" alignItems="center">
            <Image src={logoIcon} alt="itemdb logo" width={300} quality={100} />
            <Text mt={4} textAlign="center">
              {t('Login.moreInfo')}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {t('Login.neopetsUsernameReason')}
            </Text>
            {!!error && (
              <Text color="red.400" textAlign="center">
                {error}
              </Text>
            )}
            <Field.Root>
              <Field.Label>{t('Login.itemdb-username')}</Field.Label>
              <Input
                placeholder={t('Login.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="subtle"
              />
              <Field.HelperText>{t('Login.only-letters-numbers-and-underlines')}</Field.HelperText>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t('Login.neopets-username')}</Field.Label>
              <Input
                placeholder={t('Login.neopets-username')}
                value={neopetsUser}
                onChange={(e) => setNeopetsUser(e.target.value)}
                variant="subtle"
              />
              <Field.HelperText>{t('Login.neopetsUsernameReason')}</Field.HelperText>
            </Field.Root>
            <Button onClick={saveChanges}>{t('General.continue')}</Button>
          </Flex>
        )}
      </Center>
    </>
  );
};

export default LoginPage;

export async function getStaticProps(context: any) {
  const locale = resolvePageLocale(context.params?.locale as string);
  return {
    props: {
      messages: await loadTranslation(locale, 'login'),
      locale: locale,
    },
  };
}

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout mainColor="#4A5568c7" SEO={{ noindex: true }}>
      {page}
    </Layout>
  );
};

export async function getStaticPaths() {
  return getLocaleStaticPaths();
}
