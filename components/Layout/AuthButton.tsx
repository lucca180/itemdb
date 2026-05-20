'use client';

import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Text,
  Flex,
} from '@chakra-ui/react';
import { User } from '@types';
import { useAuth } from '@utils/auth';
import { getScriptStatus } from '@utils/scriptUtils';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';
import ClientPortal from '@components/Utils/ClientPortal';

const LoginModal = dynamic(() => import('../Modal/LoginModal'));

type AuthButtonProps = {
  initialUser?: User | null;
};

export const AuthButton = (props: AuthButtonProps) => {
  const t = useTranslations();
  const { user: authUser, signout, authLoading } = useAuth();
  const { initialUser } = props;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const user = authUser ?? initialUser;

  return (
    <>
      {isOpen && <LoginModal isOpen={isOpen} onClose={onClose} />}
      <Box
        display="flex"
        gap={{ base: 2, md: 3 }}
        alignItems="center"
        justifyContent="flex-end"
        maxW="30%"
        minW="15%"
      >
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
          <>
            <Menu>
              <MenuButton
                cursor="pointer"
                as={Button}
                rightIcon={<ChevronDownIcon />}
                px={{ base: 2, md: 4 }}
                textAlign="center"
                data-umami-event="profile-menu-button"
              >
                <Box
                  as="span"
                  display={{ base: 'none', md: 'block' }}
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  maxWidth="150px"
                >
                  {t('Layout.hi-user', { name: user.username ?? '' })}
                </Box>
                <Icon
                  as={BsFillPersonFill}
                  display={{ base: 'inherit', md: 'none' }}
                  boxSize="18px"
                />
              </MenuButton>
              <ClientPortal>
                <MenuList>
                  <MenuGroup
                    title={t('Layout.hello-user', { name: user.username ?? '' })}
                    color="whiteAlpha.700"
                  >
                    <MenuItem as={Link} prefetch={false} href={`/lists/${user.username}`}>
                      {t('Layout.my-lists')}
                    </MenuItem>
                    <MenuItem as={Link} prefetch={false} href={`/contribute`}>
                      {t('Layout.how-to-contribute')}
                    </MenuItem>
                  </MenuGroup>
                  <Box display={{ base: 'none', md: 'block' }}>
                    <ScriptStatus />
                  </Box>
                  <MenuDivider />
                  <MenuItem onClick={signout}>{t('Layout.logout')}</MenuItem>
                </MenuList>
              </ClientPortal>
            </Menu>
          </>
        )}
      </Box>
    </>
  );
};

const ScriptStatus = () => {
  const scriptStatus = getScriptStatus();
  const t = useTranslations();

  if (!scriptStatus) return null;

  return (
    <>
      <MenuDivider />
      <Text px={3} pb={3} fontSize={'md'} color="white">
        {t('Layout.script-info')}
      </Text>
      {Object.values(scriptStatus).map((script) => {
        if (script.status === 'notFound' && script.name !== 'Item Data Extractor') return null;
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
                size={'xs'}
                variant={'outline'}
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
                size={'xs'}
                variant={'outline'}
                colorScheme="green"
              >
                {t('Restock.install-now')}
              </Button>
            )}
          </Flex>
        );
      })}
      <MenuItem as={Link} prefetch={false} href={`/tools/troubleshooting`} fontSize={'sm'}>
        {t('Layout.troubleshooting')}
      </MenuItem>
    </>
  );
};
