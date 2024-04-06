/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Flex,
  Text,
  Button,
  Stack,
  Badge,
  Heading,
  Icon,
  Tooltip,
  Box,
  Link,
  Image,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import Color from 'color';
import { BiLinkExternal } from 'react-icons/bi';
import { MdWarning } from 'react-icons/md';
import NextLink from 'next/link';
import { ItemData, ListItemInfo, UserList } from '../../types';
import { useMemo } from 'react';
import { useAuth } from '../../utils/auth';
import icon from '../../public/logo_icon.svg';
import GiftBox from '../../public/icons/giftbox.png';
import NPBag from '../../public/icons/npbag.png';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { FaShareAlt } from 'react-icons/fa';
const Markdown = dynamic(() => import('../Utils/Markdown'));

type ListHeaderProps = {
  list: UserList;
  color: Color<string>;
  items: { [item_iid: string]: ItemData };
  itemInfo: { [itemInfoId: number]: ListItemInfo & { hasChanged?: boolean } };
  isOwner: boolean;
  setOpenCreateModal?: (value: boolean) => void;
};

const intl = new Intl.NumberFormat();

const ListHeader = (props: ListHeaderProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { list, color, items, itemInfo, isOwner, setOpenCreateModal } = props;
  const { user } = useAuth();
  const rgb = color.rgb().array();

  const unpricedItems = useMemo(() => {
    if (!list) return 0;

    return Object.values(items).reduce((acc, item) => {
      if (!item) return acc;

      if (!item.isNC && !item.price.value && item.status === 'active') return acc + 1;

      return acc;
    }, 0);
  }, [items]);

  const NPPrice = useMemo(() => {
    if (!list) return 0;

    return list.itemInfo.reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.price.value) return acc;

      return acc + itemData.price.value * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const NCPrice = useMemo(() => {
    if (!list) return 0;

    return list.itemInfo.reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.owls || !itemData.owls.valueMin) return acc;

      return acc + itemData.owls.valueMin * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const copyLink = () => {
    const userName = list.official ? 'official' : list.owner.username;
    navigator.clipboard.writeText(
      `${window.location.origin}/lists/${userName}/${list.internal_id}`
    );
    toast({
      title: t('General.link-copied'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Box
        position="absolute"
        h="30vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      <Flex gap={{ base: 3, md: 6 }} pt={6} alignItems="center">
        <Flex
          position="relative"
          p={{ base: 1, md: 2 }}
          bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
          borderRadius="md"
          flexFlow="column"
          justifyContent="center"
          alignItems="center"
          boxShadow="sm"
          textAlign="center"
          minW={{ base: '100px', md: '150px' }}
          minH={{ base: '100px', md: '150px' }}
          flex="0 0 auto"
        >
          {!list.coverURL && (
            <Image
              as={NextImage}
              src={icon}
              width={{ base: '50px', md: '80px' }}
              style={{ opacity: 0.85, flex: 1 }}
              alt={'List Cover'}
            />
          )}
          {list.coverURL && (
            <Image
              src={list.coverURL}
              objectFit="cover"
              width={{ base: '100px', md: '150px' }}
              height={{ base: '100px', md: '150px' }}
              borderRadius="md"
              alt={'List Cover'}
            />
          )}
          {(isOwner || user?.isAdmin) && (
            <Button
              variant="solid"
              mt={3}
              colorScheme={color.isLight() ? 'blackAlpha' : 'gray'}
              onClick={() => setOpenCreateModal?.(true)}
              size="sm"
            >
              {t('Lists.edit-list-info')}
            </Button>
          )}
        </Flex>
        <Box>
          <Stack direction="row" mb={1} alignItems="center">
            {!list.official && list.purpose !== 'none' && (
              <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                {t('Lists.' + list.purpose)}
              </Badge>
            )}
            {list.official && (
              <Badge
                as={NextLink}
                href="/lists/official"
                borderRadius="md"
                colorScheme="blue"
                variant="solid"
              >
                ✓ {t('General.official')}
              </Badge>
            )}
            {list.visibility !== 'public' && (
              <Badge
                borderRadius="md"
                colorScheme={color.isLight() ? 'black' : 'gray'}
                variant="solid"
              >
                {t('Lists.' + list.visibility)}
              </Badge>
            )}
          </Stack>
          <Heading
            size={{ base: 'lg', md: undefined }}
            display="inline-flex"
            alignItems={'center'}
            gap={1}
          >
            {list.name}

            {!!list.dynamicType && (
              <IconButton
                aria-label="Share Link"
                size="sm"
                icon={
                  <Tooltip hasArrow label={`Dynamic List`} placement="top">
                    <NextImage
                      src={DynamicIcon}
                      alt="lightning bolt"
                      width={12}
                      style={{ display: 'inline' }}
                    />
                  </Tooltip>
                }
                bg="blackAlpha.300"
                borderRadius={'md'}
              />
            )}
            {list.visibility !== 'private' && (
              <IconButton
                onClick={copyLink}
                bg="blackAlpha.300"
                size="sm"
                aria-label={t('Layout.copy-link')}
                icon={
                  <Tooltip hasArrow label={t('Layout.copy-link')} placement="top">
                    <span>
                      <FaShareAlt />
                    </span>
                  </Tooltip>
                }
              />
            )}
          </Heading>
          <Stack direction="row" mb={1} alignItems="center" flexWrap="wrap">
            <Text fontSize={{ base: 'xs', md: 'sm' }}>
              {t.rich(list.official ? 'Lists.curatedBy' : 'Lists.by', {
                Link: (chunk) => (
                  <Link as={NextLink} fontWeight="bold" href={'/lists/' + list.owner.username}>
                    {chunk}
                  </Link>
                ),
                username: list.owner.username,
              })}
            </Text>
            {!list.official && list.owner.neopetsUser && (
              <>
                <Link
                  isExternal
                  display={{ base: 'none', md: 'inline' }}
                  href={`http://www.neopets.com/userlookup.phtml?user=${list.user_neouser}`}
                >
                  <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                    {t('General.userlookup')} <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Badge>
                </Link>
                <Link
                  isExternal
                  display={{ base: 'none', md: 'inline' }}
                  href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${list.user_neouser}`}
                >
                  <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                    {t('General.neomail')} <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Badge>
                </Link>
              </>
            )}
          </Stack>
          {list.description && (
            <Text
              mt={{ base: 2, md: 3 }}
              fontSize={{ base: 'sm', md: 'md' }}
              sx={{ a: { color: color.lightness(70).hex() } }}
              as="div"
            >
              <Markdown>{list.description}</Markdown>
            </Text>
          )}
          {(!!NPPrice || !!NCPrice) && (
            <Flex
              display={'inline-flex'}
              mt={{ base: 2, md: 3 }}
              py={1}
              px={2}
              bg="blackAlpha.300"
              borderRadius={'md'}
              alignItems="flex-start"
            >
              <Tooltip
                hasArrow
                label={t('Lists.unpricedItems', { 0: unpricedItems })}
                placement="top"
                isDisabled={!unpricedItems}
              >
                <Text fontSize="sm">
                  {!!unpricedItems && (
                    <span>
                      <Icon as={MdWarning} boxSize={'1rem'} mr="0.2rem" verticalAlign="text-top" />
                    </span>
                  )}
                  {t('Lists.this-list-costs-aprox')}{' '}
                  {!!NPPrice && (
                    <>
                      <b>{intl.format(NPPrice)} NP</b>
                      <Image
                        as={NextImage}
                        display="inline"
                        verticalAlign="bottom"
                        //@ts-ignore
                        src={NPBag}
                        width="24px"
                        height="24px"
                        alt="gift box icon"
                        mt="-7px"
                        ml="3px"
                      />
                    </>
                  )}{' '}
                  {!!NPPrice && !!NCPrice && t('General.and')}{' '}
                  {!!NCPrice && (
                    <>
                      <b>
                        {intl.format(NCPrice)} {t('General.caps')}
                      </b>{' '}
                      <Image
                        as={NextImage}
                        display="inline"
                        verticalAlign="bottom"
                        //@ts-ignore
                        src={GiftBox}
                        width="24px"
                        height="24px"
                        alt="gift box icon"
                      />
                    </>
                  )}
                </Text>
              </Tooltip>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default ListHeader;
