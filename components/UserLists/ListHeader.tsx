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
} from '@chakra-ui/react';
import { useToast } from '@utils/toast';
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
import { LuFileSpreadsheet } from 'react-icons/lu';

const Markdown = dynamic(() => import('../Utils/Markdown'));
const ListPriceHistoryModal = dynamic<ListPriceHistoryModalProps>(
  () => import('../Modal/ListPriceHistoryModal')
);
const DynamicHistoryModal = dynamic(() => import('../Modal/DynamicListLogsModal'));
const ExportListDataModal = dynamic(() => import('../Modal/ExportListModal'));

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
  const { open, onOpen, onClose } = useDisclosure();
  const { open: isOpenDynamic, onOpen: onOpenDynamic, onClose: onCloseDynamic } = useDisclosure();
  const { open: isOpenExport, onOpen: onOpenExport, onClose: onCloseExport } = useDisclosure();
  const { user } = useAuth();
  const rgb = color.rgb().array();

  const unpricedItems = useMemo(() => {
    if (!list) return 0;

    return Object.values(itemInfo).reduce((acc, item) => {
      const itemData = items[item.item_iid];

      if (
        itemData &&
        ((itemData.isNC && !itemData.ncValue) || (!itemData.isNC && !itemData.price.value)) &&
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
  }, [itemInfo, items]);

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
      <Box pt={2}>{list.official && <ListBreadcrumb list={list} />}</Box>
      <Flex
        gap={{ base: 3, md: 6 }}
        pt={4}
        alignItems="center"
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
              colorPalette={color.isLight() ? 'blackAlpha' : 'gray'}
              onClick={() => setOpenCreateModal?.(true)}
              size="sm"
              loading={isLoading}
            >
              {t('Lists.edit-list-info')}
            </Button>
          )}
        </Flex>
        <Box>
          <Stack
            direction="row"
            mb={1}
            alignItems="center"
            justifyContent={{ base: 'center', md: 'flex-start' }}
          >
            {!list.official && list.purpose !== 'none' && (
              <Badge borderRadius="md" colorPalette={color.isLight() ? 'black' : 'gray'}>
                {t('Lists.' + list.purpose)}
              </Badge>
            )}
            {list.official && (
              <Badge asChild borderRadius="md" colorPalette="blue" variant="solid">
                <NextLink href="/lists/official">✓ {t('General.official')}</NextLink>
              </Badge>
            )}
            {!list.official && list.visibility !== 'public' && (
              <Badge
                borderRadius="md"
                colorPalette={color.isLight() ? 'black' : 'gray'}
                variant="solid"
              >
                {t('Lists.' + list.visibility)}
              </Badge>
            )}
            {!list.official && list.owner.neopetsUser && list.purpose !== 'none' && (
              <>
                <Badge
                  asChild
                  borderRadius="md"
                  colorPalette={color.isLight() ? 'black' : 'gray'}
                  data-umami-event="user-interact"
                  data-umami-event-type="userlookup"
                >
                  <Link
                    href={`http://www.neopets.com/userlookup.phtml?user=${list.owner.neopetsUser}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('General.userlookup')} <Icon as={BiLinkExternal} verticalAlign="text-top" />
                  </Link>
                </Badge>

                <Badge
                  asChild
                  borderRadius="md"
                  colorPalette={color.isLight() ? 'black' : 'gray'}
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
          </Stack>
          <Heading
            size={{ base: 'lg', md: undefined }}
            as={'h1'}
            display="inline-flex"
            alignItems={'center'}
            justifyContent={{ base: 'center', md: 'flex-start' }}
            gap={2}
          >
            {list.name}

            {!!list.dynamicType && (
              <Tooltip.Root positioning={{ placement: 'top' }}>
                <Tooltip.Trigger asChild>
                  <IconButton
                    ml={1}
                    aria-label="Dynamic List History"
                    data-umami-event="dynamic-list-history"
                    size="sm"
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
                    onClick={copyLink}
                    data-umami-event="copy-link"
                    bg="blackAlpha.300"
                    size="sm"
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
                    size="sm"
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
          </Heading>
          <Stack
            direction="row"
            mb={1}
            alignItems="center"
            flexWrap="wrap"
            justifyContent={{ base: 'center', md: 'flex-start' }}
          >
            <Text fontSize={{ base: 'xs', md: 'sm' }}>
              {t.rich(list.official ? 'Lists.curatedBy' : 'Lists.by', {
                Link: (chunk) => (
                  <Link asChild fontWeight="bold">
                    <NextLink href={'/lists/' + list.owner.username}>{chunk}</NextLink>
                  </Link>
                ),
                username: list.owner.username ?? '',
              })}
              {!list.dynamicType && (
                <>
                  {' '}
                  •{' '}
                  {t.rich('Lists.updated-x', {
                    b: (chunk) => <b>{chunk}</b>,
                    x: format.relativeTime(new Date(list.updatedAt)),
                  })}
                </>
              )}
            </Text>
          </Stack>
          {/* {list.seriesStart && list.seriesEnd && (
            <Text fontSize={'xs'} mt={1} color="whiteAlpha.700">
              Available from{' '}
              <b>
                {format.dateTime(new Date(list.seriesStart), {
                  dateStyle: 'short',
                })}
              </b>{' '}
              through{' '}
              <b>
                {format.dateTime(new Date(list.seriesEnd), {
                  dateStyle: 'short',
                })}
              </b>
            </Text>
          )} */}
          {list.description && (
            <Text
              mt={{ base: 2, md: 3 }}
              fontSize={{ base: 'sm', md: 'md' }}
              css={{ a: { color: color.lightness(70).hex() } }}
              as="h2"
            >
              <Markdown skipParagraph>{list.description}</Markdown>
            </Text>
          )}

          <Stack
            mt={{ base: 2, md: 3 }}
            flexFlow={'row'}
            alignItems={'center'}
            justifyContent={{ base: 'center', md: 'flex-start' }}
          >
            {(!!NPPrice || !!NCPrice) && (
              <Flex
                display={'inline-flex'}
                py={1}
                px={2}
                bg="blackAlpha.300"
                borderRadius={'md'}
                alignItems="flex-start"
              >
                <Tooltip.Root positioning={{ placement: 'top' }} disabled={!unpricedItems}>
                  <Tooltip.Trigger asChild>
                    <Text fontSize="sm" cursor={unpricedItems ? 'default' : undefined}>
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
                            src={NPBag}
                            width={24}
                            height={24}
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
                            src={GiftBox}
                            width={24}
                            height={24}
                            alt="gift box icon"
                          />
                        </>
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
            {item_iids.length > 0 && item_iids.length < MAX_ITEMS_LIST_PRICE && (
              <IconButton onClick={onOpen} size="sm" py={1} bg="blackAlpha.300" aria-label="Chart">
                <AiOutlineAreaChart />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
};

export default ListHeader;
