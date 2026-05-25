'use client';

import { ChevronDownIcon } from '@utils/theme/chakraIcons';
import { Box, Button, Icon, Menu, Portal, Text, Flex, useDisclosure } from '@chakra-ui/react';
import { User } from '@types';
import { useAuth } from '@utils/auth';
import { getScriptStatus } from '@utils/scriptUtils';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';

const LoginModal = dynamic(() => import('../Modal/LoginModal'));

type AuthButtonProps = {
  initialUser?: User | null;
};

export const AuthButton = (props: AuthButtonProps) => {
  const t = useTranslations();
  const { user: authUser, signout, authLoading } = useAuth();
  const { initialUser } = props;

  const { open: isOpen, onOpen, onClose } = useDisclosure();

  const user = authUser ?? initialUser;

  return (
    <>
      {isOpen && <LoginModal isOpen={isOpen} onClose={onClose} />}
      <Box
        display="flex"
        gap={{ base: 1, md: 3 }}
        alignItems="center"
        justifyContent="flex-end"
        maxW="30%"
        minW="15%"
      >
        {!user && (
          <Button
            variant="solid"
            bg="gray.700"
            _hover={{ bg: 'gray.600' }}
            onClick={onOpen}
            px={{ base: 0, md: 4 }}
            loading={authLoading}
          >
            <Icon as={BsBoxArrowInRight} boxSize="18px" mr={2} verticalAlign="text-top" />
            <Box as="span" display={{ base: 'none', md: 'inline' }}>
              {t('Layout.login')}
            </Box>
          </Button>
        )}
        {user && (
          <Menu.Root>
            <Menu.Trigger asChild gap={0}>
              <Button
                cursor="pointer"
                variant="subtle"
                colorPalette="whiteAlpha"
                px={{ base: 1, md: 4 }}
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
                <ChevronDownIcon />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.ItemGroup>
                    <Menu.ItemGroupLabel color="whiteAlpha.600">
                      {t('Layout.hello-user', { name: user.username ?? '' })}
                    </Menu.ItemGroupLabel>
                    <Menu.Item
                      value="my-lists"
                      asChild
                      _hover={{ bg: 'blackAlpha.400' }}
                      cursor="pointer"
                    >
                      <NextLink prefetch={false} href={`/lists/${user.username}`}>
                        {t('Layout.my-lists')}
                      </NextLink>
                    </Menu.Item>
                    <Menu.Item
                      value="contribute"
                      asChild
                      _hover={{ bg: 'blackAlpha.400' }}
                      cursor="pointer"
                    >
                      <NextLink prefetch={false} href="/contribute">
                        {t('Layout.how-to-contribute')}
                      </NextLink>
                    </Menu.Item>
                  </Menu.ItemGroup>
                  <Box display={{ base: 'none', md: 'block' }}>
                    <ScriptStatus />
                  </Box>
                  <Menu.Separator />
                  <Menu.Item
                    value="logout"
                    onClick={signout}
                    _hover={{ bg: 'blackAlpha.400' }}
                    cursor="pointer"
                  >
                    {t('Layout.logout')}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
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
      <Menu.Separator />
      <Text px={2} pb={3} fontSize={'sm'} color="white">
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
              <Button asChild size={'xs'} variant={'outline'} colorPalette="orange">
                <a href={script.link} target="_blank" rel="noreferrer">
                  {t('Layout.update-available')}
                </a>
              </Button>
            )}
            {script.status === 'notFound' && (
              <Button asChild size={'xs'} variant={'outline'} colorPalette="green">
                <a href={script.link} target="_blank" rel="noreferrer">
                  {t('Restock.install-now')}
                </a>
              </Button>
            )}
          </Flex>
        );
      })}
      <Menu.Item
        value="troubleshooting"
        asChild
        fontSize={'sm'}
        _hover={{ bg: 'blackAlpha.400' }}
        cursor="pointer"
      >
        <NextLink prefetch={false} href="/tools/troubleshooting">
          {t('Layout.troubleshooting')}
        </NextLink>
      </Menu.Item>
    </>
  );
};
