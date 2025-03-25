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
  IconButton,
  useToast,
  useDisclosure,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { ColorInstance } from 'color';
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
import { useFormatter, useTranslations } from 'next-intl';
import { FaShareAlt } from 'react-icons/fa';
import { MAX_ITEMS_LIST_PRICE, ListPriceHistoryModalProps } from '../Modal/ListPriceHistoryModal';
import { AiOutlineAreaChart } from 'react-icons/ai';
import Image from '../Utils/Image';
import { ListBreadcrumb } from '../Breadcrumbs/ListBreadcrumb';

const Markdown = dynamic(() => import('../Utils/Markdown'));
const ListPriceHistoryModal = dynamic<ListPriceHistoryModalProps>(
  () => import('../Modal/ListPriceHistoryModal')
);

type ListHeaderProps = {
  list: UserList;
  color: ColorInstance;
  items: { [item_iid: string]: ItemData };
  itemInfo: { [itemInfoId: number]: ListItemInfo & { hasChanged?: boolean } };
  canEdit: boolean;
  isLoading?: boolean;
  setOpenCreateModal?: (value: boolean) => void;
};

const ListHeader = (props: ListHeaderProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const toast = useToast();
  const { list, color, items, itemInfo, canEdit: isOwner, setOpenCreateModal, isLoading } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const rgb = color.rgb().array();

  const unpricedItems = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];

      if (
        itemData &&
        !itemData.isNC &&
        !itemData.price.value &&
        itemData.status === 'active' &&
        !item.isHidden
      )
        return acc + 1;

      return acc;
    }, 0);
  }, [items, itemInfo]);

  const NPPrice = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.price.value || item.isHidden) return acc;

      return acc + itemData.price.value * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const NCPrice = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.owls || !itemData.owls.valueMin || item.isHidden) return acc;

      return acc + itemData.owls.valueMin * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const copyLink = () => {
    const userName = list.official ? 'official' : list.owner.username;
    navigator.clipboard.writeText(
      `${window.location.origin}/lists/${userName}/${list.slug ?? list.internal_id}`
    );
    toast({
      title: t('General.link-copied'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const item_iids = useMemo(() => {
    return Object.values(itemInfo)
      .filter((item) => {
        const itemData = items[item.item_iid];
        if (!itemData) return false;
        return !itemData.isNC && !item.isHidden;
      })
      .map((item) => item.item_iid);
  }, [itemInfo]);

  return (
    <Box>
      {isOpen && (
        <ListPriceHistoryModal
          listColor={color}
          isOpen={isOpen}
          onClose={onClose}
          item_iids={item_iids}
        />
      )}
      <Box
        position="absolute"
        h="40vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      <Box pt={2}>{list.official && <ListBreadcrumb list={list} />}</Box>
      <Flex gap={{ base: 3, md: 6 }} pt={4} alignItems="center">
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
              priority
              src={icon}
              width={{ base: '50px', md: '80px' }}
              style={{ opacity: 0.85, flex: 1 }}
              alt={'List Cover'}
            />
          )}
          {list.coverURL && list.official && (
            <Image
              src={list.coverURL}
              priority
              width={150}
              height={150}
              objectFit="cover"
              w={{ base: '100px', md: '150px' }}
              h={{ base: '100px', md: '150px' }}
              borderRadius="md"
              quality={100}
              alt={'List Cover'}
            />
          )}
          {list.coverURL && !list.official && (
            <ChakraImage
              objectFit="cover"
              src={list.coverURL}
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
              isLoading={isLoading}
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
            as={'h1'}
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
                  href={`http://www.neopets.com/userlookup.phtml?user=${list.owner.neopetsUser}`}
                >
                  <Badge borderRadius="md" colorScheme={color.isLight() ? 'black' : 'gray'}>
                    {t('General.userlookup')} <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Badge>
                </Link>
                <Link
                  isExternal
                  display={{ base: 'none', md: 'inline' }}
                  href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${list.owner.neopetsUser}`}
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
              as="h2"
            >
              <Markdown skipParagraph>{list.description}</Markdown>
            </Text>
          )}
          <Stack mt={{ base: 2, md: 3 }} flexFlow={'row'} alignItems={'center'}>
            {(!!NPPrice || !!NCPrice) && (
              <Flex
                display={'inline-flex'}
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
                        <Icon
                          as={MdWarning}
                          boxSize={'1rem'}
                          mr="0.2rem"
                          verticalAlign="text-top"
                        />
                      </span>
                    )}
                    {t('Lists.this-list-costs-aprox')}{' '}
                    {!!NPPrice && (
                      <>
                        <b>{format.number(NPPrice)} NP</b>
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
                          {format.number(NCPrice)} {t('General.caps')}
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
            {item_iids.length > 0 && item_iids.length < MAX_ITEMS_LIST_PRICE && (
              <IconButton
                onClick={onOpen}
                size="sm"
                py={1}
                bg="blackAlpha.300"
                aria-label="Chart"
                icon={<AiOutlineAreaChart />}
              />
            )}
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
};

export default ListHeader;
