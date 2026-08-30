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
  useDisclosure,
  Image as ChakraImage,
  SimpleGrid,
  Grid,
  HStack,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { ColorInstance } from 'color';
import { BiLinkExternal } from 'react-icons/bi';
import { MdDateRange } from 'react-icons/md';
import MainLink from '@components/Utils/MainLink';
import type { ItemV2For, ListItemInfo, UserList } from '@types';
import { useMemo } from 'react';
import { useAuth } from '../../utils/auth';
import icon from '../../public/logo_icon.svg';
import GiftBox from '../../public/icons/giftbox.png';
import NPBag from '../../public/icons/npbag.png';
import DynamicIcon from '../../public/icons/dynamic.png';
import NextImage from 'next/image';
import dynamic from 'next/dynamic';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { FaShareAlt } from 'react-icons/fa';
import { MAX_ITEMS_LIST_PRICE, ListPriceHistoryModalProps } from '../Modal/ListPriceHistoryModal';
import { AiOutlineAreaChart } from 'react-icons/ai';
import Image from '../Utils/Image';
import { ListBreadcrumb } from '../Breadcrumbs/ListBreadcrumb';
import { LuFileSpreadsheet } from 'react-icons/lu';

const Markdown = dynamic(() => import('../Utils/Markdown'), { ssr: false });
const ListPriceHistoryModal = dynamic<ListPriceHistoryModalProps>(
  () => import('../Modal/ListPriceHistoryModal'),
  { ssr: false }
);
const DynamicHistoryModal = dynamic(() => import('../Modal/DynamicListLogsModal'), { ssr: false });
const ExportListDataModal = dynamic(() => import('../Modal/ExportListModal'), { ssr: false });

type ListHeaderProps = {
  list: UserList;
  color: ColorInstance;
  items: { [item_iid: string]: ItemV2For<'card'> };
  itemInfo: { [itemInfoId: number]: ListItemInfo & { hasChanged?: boolean } };
  canEdit: boolean;
  isLoading?: boolean;
  setOpenCreateModal?: (value: boolean) => void;
};

function HeaderActionButtons({
  list,
  isOwner,
  onOpenDynamic,
  onCopyLink,
  onOpenExport,
}: {
  list: UserList;
  isOwner: boolean;
  onOpenDynamic: () => void;
  onCopyLink: () => void;
  onOpenExport: () => void;
}) {
  const t = useTranslations();

  return (
    <Flex gap={2} flexWrap="wrap" alignItems="center" justifyContent="center" flex="0 0 auto">
      {!!list.dynamicType && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <IconButton
              aria-label="Dynamic List History"
              data-umami-event="dynamic-list-history"
              size="xs"
              onClick={list.official || isOwner ? onOpenDynamic : undefined}
              bg="blackAlpha.300"
              borderRadius={'md'}
            >
              <NextImage
                src={DynamicIcon}
                alt="lightning bolt"
                width={12}
                style={{ display: 'inline' }}
              />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>{t('DynamicList.dynamic-list-history')}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
      {list.visibility !== 'private' && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={onCopyLink}
              data-umami-event="copy-link"
              bg="blackAlpha.300"
              size="xs"
              aria-label={t('Layout.copy-link')}
            >
              <FaShareAlt />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>{t('Layout.copy-link')}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
      {(list.official || isOwner) && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <IconButton
              aria-label="Export as CSV"
              data-umami-event="export-list"
              size="xs"
              onClick={onOpenExport}
              bg="blackAlpha.300"
              borderRadius={'md'}
            >
              <LuFileSpreadsheet />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>{t('Lists.export-as-csv')}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
    </Flex>
  );
}

const ListHeader = (props: ListHeaderProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow();
  const toast = useToast();
  const { list, color, items, itemInfo, canEdit: isOwner, setOpenCreateModal, isLoading } = props;
  const { open, onOpen, onClose } = useDisclosure();
  const { open: isOpenDynamic, onOpen: onOpenDynamic, onClose: onCloseDynamic } = useDisclosure();
  const { open: isOpenExport, onOpen: onOpenExport, onClose: onCloseExport } = useDisclosure();
  const { user } = useAuth();
  const rgb = color.rgb().array();
  const badgeColor = color.isLight() ? 'black' : 'gray';

  const unpricedItems = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];

      if (
        itemData &&
        ((itemData.type === 'nc' && !itemData.ncValue) ||
          (itemData.type !== 'nc' && !(itemData.price?.type === 'np' && itemData.price.value))) &&
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
      if (!itemData || itemData.price?.type !== 'np' || !itemData.price.value || item.isHidden)
        return acc;

      return acc + itemData.price.value * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const NCPrice = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];
      if (!itemData || !itemData.ncValue || !itemData.ncValue.minValue || item.isHidden) return acc;

      return acc + itemData.ncValue.minValue * item.amount;
    }, 0);
  }, [items, itemInfo]);

  const copyLink = () => {
    const userName = list.official ? 'official' : list.owner.username;
    navigator.clipboard.writeText(
      `${window.location.origin}/lists/${userName}/${list.slug ?? list.internal_id}`
    );
    toast({
      id: 'list-header-copy-link',
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
        return itemData.type !== 'nc' && !item.isHidden;
      })
      .map((item) => item.item_iid);
  }, [itemInfo, items]);

  const hasSeriesDates = !!(list.seriesStart || list.seriesEnd);
  const hasPrice = !!NPPrice || !!NCPrice;
  const hasChart = item_iids.length > 0 && item_iids.length < MAX_ITEMS_LIST_PRICE;
  const dateFormat = { day: 'numeric', month: 'short', year: 'numeric' } as const;

  return (
    <Box>
      {open && (
        <ListPriceHistoryModal
          listColor={color}
          isOpen={open}
          onClose={onClose}
          item_iids={item_iids}
        />
      )}
      {isOpenDynamic && (
        <DynamicHistoryModal list={list} isOpen={isOpenDynamic} onClose={onCloseDynamic} />
      )}
      {isOpenExport && (
        <ExportListDataModal list={list} isOpen={isOpenExport} onClose={onCloseExport} />
      )}
      <Box
        position="absolute"
        h="40vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      <Box pt={2}>{list.official && <ListBreadcrumb list={list} useAppDir />}</Box>
      <Flex
        gap={{ base: 3, md: 6 }}
        pt={4}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
        textAlign={{ base: 'center', md: 'left' }}
      >
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
              width={80}
              w={{ base: '50px', md: '80px' }}
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
              colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'}
              onClick={() => setOpenCreateModal?.(true)}
              size="xs"
              loading={isLoading}
            >
              {t('Lists.edit-list-info')}
            </Button>
          )}
        </Flex>
        <Stack
          flex="1"
          minW={0}
          gap={4}
          alignSelf="stretch"
          alignItems={{ base: 'center', md: 'stretch' }}
          w={{ base: 'full', md: 'auto' }}
        >
          <Flex
            w="full"
            justifyContent={{ base: 'center', md: 'space-between' }}
            alignItems={{ base: 'center', md: 'flex-start' }}
            gap={3}
            flexDir={{ base: 'column', md: 'row' }}
          >
            <Stack
              gap={2}
              minW={0}
              flex="1"
              w="full"
              alignItems={{ base: 'center', md: 'flex-start' }}
            >
              <Flex
                gap={2}
                flexWrap="wrap"
                alignItems="center"
                justifyContent={{ base: 'center', md: 'flex-start' }}
              >
                {!list.official && list.purpose !== 'none' && (
                  <Badge borderRadius="md" colorPalette={badgeColor}>
                    {t('Lists.' + list.purpose)}
                  </Badge>
                )}
                {list.official && (
                  <Badge asChild borderRadius="md" colorPalette="blue" variant="solid">
                    <MainLink href="/lists/official">✓ {t('General.official')}</MainLink>
                  </Badge>
                )}
                {!!list.dynamicType && (
                  <Badge asChild borderRadius="md" colorPalette={'orange'} variant="surface">
                    <MainLink
                      href="/articles/checklists-and-dynamic-lists"
                      trackEvent="dynamic-list-badge"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35em' }}
                    >
                      <NextImage
                        src={DynamicIcon}
                        alt=""
                        width={10}
                        height={10}
                        style={{ display: 'inline-block' }}
                      />
                      {t('Lists.dynamic-list-badge')}
                    </MainLink>
                  </Badge>
                )}
                {!list.official && list.visibility !== 'public' && (
                  <Badge borderRadius="md" colorPalette={badgeColor} variant="solid">
                    {t('Lists.' + list.visibility)}
                  </Badge>
                )}
                {!list.official && list.owner.neopetsUser && list.purpose !== 'none' && (
                  <>
                    <Badge
                      asChild
                      borderRadius="md"
                      colorPalette={badgeColor}
                      data-umami-event="user-interact"
                      data-umami-event-type="userlookup"
                    >
                      <Link
                        href={`http://www.neopets.com/userlookup.phtml?user=${list.owner.neopetsUser}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('General.userlookup')}{' '}
                        <Icon as={BiLinkExternal} verticalAlign="text-top" />
                      </Link>
                    </Badge>
                    <Badge
                      asChild
                      borderRadius="md"
                      colorPalette={badgeColor}
                      data-umami-event="user-interact"
                      data-umami-event-type="neomail"
                    >
                      <Link
                        href={`http://www.neopets.com/neomessages.phtml?type=send&recipient=${list.owner.neopetsUser}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('General.neomail')} <Icon as={BiLinkExternal} verticalAlign="text-top" />
                      </Link>
                    </Badge>
                  </>
                )}
              </Flex>
              <Box display={{ base: 'block', md: 'none' }}>
                <HeaderActionButtons
                  list={list}
                  isOwner={isOwner}
                  onOpenDynamic={onOpenDynamic}
                  onCopyLink={copyLink}
                  onOpenExport={onOpenExport}
                />
              </Box>
              <Heading size={{ base: 'lg', md: undefined }} as={'h1'} textWrap="balance">
                {list.name}
              </Heading>
              <Text fontSize={{ base: 'xs', md: 'sm' }}>
                {t.rich(list.official ? 'Lists.curatedBy' : 'Lists.by', {
                  Link: (chunk) => (
                    <Link asChild fontWeight="bold">
                      <MainLink href={'/lists/' + list.owner.username}>{chunk}</MainLink>
                    </Link>
                  ),
                  username: list.owner.username ?? '',
                })}
                {!list.dynamicType && (
                  <>
                    {' '}
                    •{' '}
                    {list.official
                      ? t.rich('Lists.official-updated', {
                          time: (chunks) => (
                            <time dateTime={new Date(list.updatedAt).toISOString()}>{chunks}</time>
                          ),
                          b: (chunks) => <b>{chunks}</b>,
                          date: format.dateTime(new Date(list.updatedAt), {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }),
                          relative: format.relativeTime(new Date(list.updatedAt), now),
                        })
                      : t.rich('Lists.updated-x', {
                          b: (chunk) => <b>{chunk}</b>,
                          x: format.relativeTime(new Date(list.updatedAt), now),
                        })}
                  </>
                )}
              </Text>
              {list.description && (
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  css={{ '& a': { color: color.lightness(70).hex() } }}
                  as="h2"
                >
                  <Markdown skipParagraph>{list.description}</Markdown>
                </Text>
              )}
            </Stack>
            <Box display={{ base: 'none', md: 'block' }}>
              <HeaderActionButtons
                list={list}
                isOwner={isOwner}
                onOpenDynamic={onOpenDynamic}
                onCopyLink={copyLink}
                onOpenExport={onOpenExport}
              />
            </Box>
          </Flex>
          {(hasSeriesDates || hasPrice || hasChart) && (
            <SimpleGrid
              w="full"
              columns={{ base: 1, lg: hasSeriesDates && (hasPrice || hasChart) ? 2 : 1 }}
              gap={3}
            >
              {hasSeriesDates && (
                <Box
                  px={3}
                  py={2}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="lg"
                  bg="whiteAlpha.100"
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  <HStack
                    mb={1}
                    gap={2}
                    color="whiteAlpha.800"
                    justifyContent={{ base: 'center', md: 'flex-start' }}
                  >
                    <Icon as={MdDateRange} />
                    <Text fontSize="xs" fontWeight="bold">
                      {t('Lists.series-dates')}
                    </Text>
                  </HStack>
                  <Grid
                    templateColumns="auto 1fr"
                    columnGap={3}
                    rowGap={1}
                    fontSize="sm"
                    maxW="240px"
                    mx={{ base: 'auto', md: 0 }}
                  >
                    {list.seriesStart && (
                      <>
                        <Text color="whiteAlpha.500">{t('Lists.starts')}</Text>
                        <Text fontWeight="semibold">
                          {format.dateTime(new Date(list.seriesStart), dateFormat)}
                        </Text>
                      </>
                    )}
                    {list.seriesEnd && (
                      <>
                        <Text color="whiteAlpha.500">{t('Lists.ends')}</Text>
                        <Text fontWeight="semibold">
                          {format.dateTime(new Date(list.seriesEnd), dateFormat)}
                        </Text>
                      </>
                    )}
                  </Grid>
                </Box>
              )}
              {(hasPrice || hasChart) && (
                <Flex
                  gap={2}
                  alignItems={{ base: 'center', md: 'flex-start' }}
                  justifyContent="center"
                  flexDir="column"
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg="blackAlpha.300"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  {!!unpricedItems && (
                    <Badge colorPalette="orange" variant="subtle">
                      {t('Lists.unpriced-count', { count: unpricedItems })}
                    </Badge>
                  )}
                  <Tooltip.Root positioning={{ placement: 'top' }} disabled={!unpricedItems}>
                    <Tooltip.Trigger asChild>
                      <Text
                        fontSize="sm"
                        cursor={unpricedItems ? 'default' : undefined}
                        lineHeight="1.6"
                      >
                        {hasPrice && (
                          <>
                            {t('Lists.this-list-costs-aprox')}{' '}
                            {!!NPPrice && (
                              <>
                                <b>{format.number(NPPrice)} NP</b>
                                <Image
                                  display="inline"
                                  verticalAlign="middle"
                                  src={NPBag}
                                  width={24}
                                  height={24}
                                  alt="NP icon"
                                  ml="3px"
                                />
                              </>
                            )}
                            {!!NPPrice && !!NCPrice && <> {t('General.and')} </>}
                            {!!NCPrice && (
                              <>
                                <b>
                                  {format.number(NCPrice)} {t('General.caps')}
                                </b>{' '}
                                <Image
                                  display="inline"
                                  verticalAlign="middle"
                                  src={GiftBox}
                                  width={24}
                                  height={24}
                                  alt="gift box icon"
                                />
                              </>
                            )}
                          </>
                        )}
                        {hasChart && (
                          <IconButton
                            onClick={onOpen}
                            size="xs"
                            variant="ghost"
                            display="inline-flex"
                            verticalAlign="middle"
                            ml={1}
                            aria-label={t('Lists.list-price-history')}
                          >
                            <AiOutlineAreaChart />
                          </IconButton>
                        )}
                      </Text>
                    </Tooltip.Trigger>
                    {!!unpricedItems && (
                      <Tooltip.Positioner>
                        <Tooltip.Content>
                          {t('Lists.unpricedItems', { 0: unpricedItems })}
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    )}
                  </Tooltip.Root>
                </Flex>
              )}
            </SimpleGrid>
          )}
        </Stack>
      </Flex>
    </Box>
  );
};

export default ListHeader;
