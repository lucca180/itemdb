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

type ListHeaderProps = {
  list: UserList;
  color: Color<string>;
  items: { [item_iid: string]: ItemData };
  itemInfo: { [itemInfoId: number]: ListItemInfo & { hasChanged?: boolean } };
  isOwner: boolean;
  setOpenCreateModal: (value: boolean) => void;
};

const intl = new Intl.NumberFormat();

const ListHeader = (props: ListHeaderProps) => {
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
              onClick={() => setOpenCreateModal(true)}
              size="sm"
            >
              Edit list info
            </Button>
          )}
        </Flex>
        <Box>
          <Stack direction="row" mb={1} alignItems="center">
            {!list.official && list.purpose !== 'none' && (
              <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                {list.purpose}
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
                ✓ Official
              </Badge>
            )}
            {list.visibility !== 'public' && (
              <Badge
                borderRadius="md"
                colorScheme={color.isLight() ? 'black' : 'gray'}
                variant="solid"
              >
                {list.visibility}
              </Badge>
            )}
          </Stack>
          <Heading size={{ base: 'lg', md: undefined }}>
            {list.name}
            {!!list.dynamicType && (
              <Flex
                display={'inline-flex'}
                ml={1}
                // mt={{ base: 2, md: 3 }}
                p={1}
                bg="blackAlpha.300"
                borderRadius={'md'}
                alignItems="flex-start"
              >
                <Tooltip
                  hasArrow
                  label={`Dynamic List`}
                  placement="top"
                  isDisabled={!unpricedItems}
                >
                  <NextImage
                    src={DynamicIcon}
                    alt="lightning bolt"
                    width={12}
                    style={{ display: 'inline' }}
                  />
                </Tooltip>
              </Flex>
            )}
          </Heading>
          <Stack direction="row" mb={1} alignItems="center" flexWrap="wrap">
            <Text fontSize={{ base: 'xs', md: 'sm' }}>
              {list.official ? 'curated' : ''} by{' '}
              <Link as={NextLink} fontWeight="bold" href={'/lists/' + list.owner.username}>
                {list.owner.username}
              </Link>
            </Text>
            {!list.official && list.owner.neopetsUser && (
              <>
                <Link
                  isExternal
                  display={{ base: 'none', md: 'inline' }}
                  href={`http://www.neopets.com/userlookup.phtml?user=${list.user_neouser}`}
                >
                  <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                    Userlookup <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Badge>
                </Link>
                <Link
                  isExternal
                  display={{ base: 'none', md: 'inline' }}
                  href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${list.user_neouser}`}
                >
                  <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                    Neomail <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Badge>
                </Link>
              </>
            )}
          </Stack>
          {list.description && (
            <Text mt={{ base: 2, md: 3 }} fontSize={{ base: 'sm', md: 'md' }}>
              {list.description}
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
                label={`There are ${unpricedItems} items without a price`}
                placement="top"
                isDisabled={!unpricedItems}
              >
                <Text fontSize="sm">
                  {!!unpricedItems && (
                    <span>
                      <Icon as={MdWarning} boxSize={'1rem'} mr="0.2rem" verticalAlign="middle" />
                    </span>
                  )}
                  This list costs aprox.{' '}
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
                      />
                    </>
                  )}{' '}
                  {!!NPPrice && !!NCPrice && 'and'}{' '}
                  {!!NCPrice && (
                    <>
                      <b>{intl.format(NCPrice)} Caps</b>{' '}
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
