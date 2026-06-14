/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Center, Flex, Field, Input, Text, Spinner, Button, useDisclosure } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import logoIcon from '@assets/logo_white.svg';
import axios from 'axios';
import { useAuth } from '@utils/auth';
import LoginModal from '@components/Modal/LoginModal';
import { User } from '@types';
import { useRouter } from '@i18n/navigation';
import { getPathLocale, isLocalizableHref, stripLocalePrefix } from '@utils/locales';
import type { LoginPageLabels } from './buildLoginPageProps';

const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Internal app path for `@i18n/navigation` (locale applied by the router). */
function resolveLoginRedirect(redirectTo: string | undefined) {
  const path = decodeURIComponent(redirectTo ?? '/');
  if (!isLocalizableHref(path)) return path;

  const [pathname, search = ''] = path.split('?');
  const pathLocale = getPathLocale(pathname);
  const internalPath = pathLocale ? stripLocalePrefix(pathname, pathLocale) : pathname;

  return search ? `${internalPath}?${search}` : internalPath;
}

type LoginPageClientProps = {
  labels: LoginPageLabels;
  redirectTo?: string;
  token?: string;
  emailFromQuery?: string;
};

export function LoginPageClient({
  labels,
  redirectTo,
  token,
  emailFromQuery,
}: LoginPageClientProps) {
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
    const redirect = redirectTo ?? '/';

    if (token && emailFromQuery && !user) {
      try {
        const userRes = await axios.post('/api/auth/login', {
          token,
          email: emailFromQuery,
        });

        const userData = userRes.data as User;

        if (!userData.neopetsUser || !userData.username) {
          setNeopetsUser(userData.neopetsUser || '');
          setUsername(userData.username || '');
          setIsLoading(false);
          return setNeedInfo(true);
        }

        setUser(userData);
        router.replace(resolveLoginRedirect(redirect));
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

      router.replace(resolveLoginRedirect(redirect));
    } else {
      onOpen();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void init();
  }, [authLoading, redirectTo, token, emailFromQuery, user]);

  const doConfirm = () => {
    if (!email.match(mailRegex)) {
      setError(labels.invalidEmail);
      return;
    }

    void init();
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const checkUsername = async (): Promise<boolean> => {
    if (!username) return false;
    if (!username.match(/^[a-zA-Z0-9_]+$/)) return false;

    try {
      const res = await axios.get(`/api/v1/users/${username}`);
      if (res.data) return false;
      return true;
    } catch (e: any) {
      setError(e.message);
      console.error(e);
      return false;
    }
  };

  const saveChanges = async () => {
    const redirect = redirectTo ?? '/';

    setError('');
    if (!neopetsUser || !username) {
      setError(labels.fillAllFields);
      return;
    }

    if (!neopetsUser.match(/^[a-zA-Z0-9_]+$/) || !username.match(/^[a-zA-Z0-9_]+$/)) {
      setError(labels.onlyLettersNumbers);
      return;
    }

    setIsLoading(true);

    if (!(await checkUsername())) {
      setIsLoading(false);
      setError(labels.usernameTaken);
      return;
    }

    try {
      const userRes = await axios.post('/api/auth/alterUser', {
        neopetsUser,
        username,
      });

      const userData = userRes.data as User;

      if (!userData.neopetsUser || !userData.username) {
        setIsLoading(false);
        return setNeedInfo(true);
      }

      setUser(userData);
      router.replace(resolveLoginRedirect(redirect));
    } catch (e: any) {
      setError(e.message);
      console.error(e);
      setIsLoading(false);
    }
  };

  const closeLogin = () => {
    onClose();
    router.replace(resolveLoginRedirect(redirectTo ?? '/'));
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
              {labels.confirmEmail}
            </Text>
            <Field.Root invalid={!!error}>
              <Input
                placeholder={labels.emailPlaceholder}
                type="email"
                value={email}
                onChange={onEmailChange}
              />
            </Field.Root>
            <Button onClick={doConfirm}>{labels.continue}</Button>
          </Flex>
        )}

        {!isLoading && needInfo && (
          <Flex flexFlow="column" gap={4} justifyContent="center" alignItems="center">
            <Image src={logoIcon} alt="itemdb logo" width={300} quality={100} />
            <Text mt={4} textAlign="center">
              {labels.moreInfo}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {labels.neopetsUsernameReason}
            </Text>
            {!!error && (
              <Text color="red.400" textAlign="center">
                {error}
              </Text>
            )}
            <Field.Root>
              <Field.Label>{labels.itemdbUsername}</Field.Label>
              <Input
                placeholder={labels.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="subtle"
              />
              <Field.HelperText>{labels.usernameHelper}</Field.HelperText>
            </Field.Root>
            <Field.Root>
              <Field.Label>{labels.neopetsUsername}</Field.Label>
              <Input
                placeholder={labels.neopetsUsernamePlaceholder}
                value={neopetsUser}
                onChange={(e) => setNeopetsUser(e.target.value)}
                variant="subtle"
              />
              <Field.HelperText>{labels.neopetsUsernameReason}</Field.HelperText>
            </Field.Root>
            <Button onClick={saveChanges}>{labels.continue}</Button>
          </Flex>
        )}
      </Center>
    </>
  );
}
