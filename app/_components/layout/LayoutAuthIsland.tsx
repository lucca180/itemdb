'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { getScriptStatus } from '@utils/scriptUtils';
import type { LoginModalProps } from '@components/Modal/LoginModal';

const LoginModal = dynamic<LoginModalProps>(() => import('@components/Modal/LoginModal'));

export function LayoutAuthIsland() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const currentPath = pathname + (searchParams?.size ? `?${searchParams.toString()}` : '');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signout, authLoading } = useAuth();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', {
    ssr: true,
    fallback: false,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.username && !['/', '/login'].includes(pathname)) {
      router.push('/login');
    }
  }, [pathname, router, user, currentPath]);

  return (
    <>
      {isOpen && <LoginModal isOpen={isOpen} onClose={onClose} />}
      {!user && (
        <Button
          variant="filled"
          bg="gray.700"
          _hover={{ bg: 'gray.600' }}
          onClick={onOpen}
          px={{ base: 0, md: 4 }}
          isLoading={authLoading}
        >
          <Icon as={BsBoxArrowInRight} boxSize="18px" mr={2} verticalAlign="text-top" />
          <Box as="span" display={{ base: 'none', md: 'inline' }}>
            {t('Layout.login')}
          </Box>
        </Button>
      )}
      {user && (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            px={{ base: 2, md: 4 }}
            textAlign="center"
            data-umami-event="profile-menu-button"
          >
            {isLargerThanMD && (
              <Box as="span">{t('Layout.hi-user', { name: user.username ?? '' })}</Box>
            )}
            <Icon as={BsFillPersonFill} display={{ base: 'inherit', md: 'none' }} boxSize="18px" />
          </MenuButton>
          <Portal>
            <MenuList>
              <MenuGroup
                title={
                  !isLargerThanMD
                    ? `${t('Layout.hello-user', { name: user.username ?? '' })}`
                    : undefined
                }
              >
                <MenuItem as={Link} prefetch={false} href={`/lists/${user.username}`}>
                  {t('Layout.my-lists')}
                </MenuItem>
                <MenuItem as={Link} prefetch={false} href="/contribute">
                  {t('Layout.how-to-contribute')}
                </MenuItem>
              </MenuGroup>
              {isLargerThanMD && <ScriptStatus />}
              <MenuDivider />
              <MenuItem onClick={() => void signout()}>{t('Layout.logout')}</MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      )}
    </>
  );
}

function ScriptStatus() {
  const scriptStatus = getScriptStatus();
  const t = useTranslations();

  if (!scriptStatus) {
    return null;
  }

  return (
    <>
      <MenuDivider />
      <Text px={3} pb={3} fontSize="md" color="white">
        {t('Layout.script-info')}
      </Text>
      {Object.values(scriptStatus).map((script) => {
        if (script.status === 'notFound' && script.name !== 'Item Data Extractor') {
          return null;
        }

        return (
          <Flex
            key={script.name}
            alignItems="center"
            gap={2}
            fontSize="xs"
            color="whiteAlpha.700"
            px={3}
            pb={2}
          >
            <Text>
              {script.name} {script.version ? `- ${script.version}` : ''}
            </Text>
            {script.status === 'outdated' && (
              <Button
                as="a"
                href={script.link}
                target="_blank"
                size="xs"
                variant="outline"
                colorScheme="orange"
              >
                {t('Layout.update-available')}
              </Button>
            )}
            {script.status === 'notFound' && (
              <Button
                as="a"
                href={script.link}
                target="_blank"
                size="xs"
                variant="outline"
                colorScheme="green"
              >
                {t('Restock.install-now')}
              </Button>
            )}
          </Flex>
        );
      })}
      <MenuItem as={Link} prefetch={false} href="/tools/troubleshooting" fontSize="sm">
        {t('Layout.troubleshooting')}
      </MenuItem>
    </>
  );
}
