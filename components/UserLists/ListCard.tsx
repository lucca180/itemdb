'use client';

import {
  Badge,
  Flex,
  Link,
  Text,
  IconButton,
  Image as ChakraImg,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { ListItemInfo, UserList } from '../../types';
import icon from '../../public/logo_icon.svg';
import DynamicIcon from '../../public/icons/dynamic.png';
import Color from 'color';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { FaPencilAlt, FaShareAlt } from 'react-icons/fa';
import Image from '../Utils/Image';
import { CreateListModalProps } from '@components/Modal/CreateListModal';
const Markdown = dynamic(() => import('../Utils/Markdown'));

const CreateListModal = dynamic<CreateListModalProps>(
  () => import('@components/Modal/CreateListModal')
);

type Props = {
  list: UserList;
  isSelected?: boolean;
  disableLink?: boolean;
  matches?: {
    seek: { [list_id: number]: ListItemInfo[] };
    trade: { [list_id: number]: ListItemInfo[] };
  };
  utm_content?: string;
  isSmall?: boolean;
  canEdit?: boolean;
  refresh?: () => void;
};

const UserListCard = (props: Props) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const toast = useToast();
  const { list, matches, isSelected, disableLink, utm_content, isSmall, canEdit } = props;
  const { open, onToggle } = useDisclosure();
  const color = Color(list?.colorHex || '#4A5568');
  const rgb = color.rgb().array();

  const matchCount = useMemo(() => {
    if (!matches) return 0;

    const seekMatches = matches.seek[list.internal_id] || [];
    const tradeMatches = matches.trade[list.internal_id] || [];

    if (list.purpose === 'trading') {
      return seekMatches.length;
    } else if (list.purpose === 'seeking') {
      return tradeMatches.length;
    }
    return 0;
  }, [list, matches]);

  const copyLink = () => {
    const userName = list.official ? 'official' : list.owner.username;
    navigator.clipboard.writeText(
      `${window.location.origin}/lists/${userName}/${list.slug ?? list.internal_id}`
    );
    toast({
      id: 'list-card-copy-link',
      title: t('General.link-copied'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      {canEdit && open && (
        <CreateListModal list={list} isOpen={open} onClose={onToggle} refresh={props.refresh} />
      )}
      <Flex
        bg="gray.700"
        p={{ base: 2, md: 3 }}
        borderRadius="md"
        overflow="visible"
        minH="150px"
        maxWidth="375px"
        minW="200px"
        w={{ base: '100%', sm: isSmall ? '350px' : '375px' }}
        gap={3}
        ml="40px"
        outline={isSelected ? '3px solid rgba(66, 153, 225, 0.6)' : undefined}
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 0%)`}
        pointerEvents={disableLink ? 'none' : 'initial'}
      >
        <Link
          asChild
          data-umami-event={utm_content}
          data-umami-event-label={utm_content ? list.slug : undefined}
          _hover={{ textDecoration: 'none' }}
        >
          <NextLink href={getListLink(list)} prefetch={false}>
            <Flex
              position="relative"
              w={{ base: '100px', sm: isSmall ? '100px' : '150px' }}
              h={{ base: '100px', sm: isSmall ? '100px' : '150px' }}
              ml="-50px"
              bg="gray.700"
              bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, .75) 0%)`}
              flex="0 0 auto"
              borderRadius="md"
              overflow="hidden"
              boxShadow={'inset'}
              outline={isSelected ? '3px solid rgba(66, 153, 225, 0.6)' : undefined}
              justifyContent="center"
              alignItems="center"
            >
              {!list.coverURL && (
                <Image src={icon} width={75} style={{ opacity: 0.85 }} alt={'List Cover'} />
              )}

              {list.coverURL && (
                <ChakraImg
                  src={list.coverURL}
                  w={{ base: '95px', sm: isSmall ? '95px' : '140px' }}
                  h={{ base: '95px', sm: isSmall ? '95px' : '140px' }}
                  alt={'List Cover'}
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
            </Flex>
          </NextLink>
        </Link>
        <Flex flexFlow="column" gap={2} w="100%">
          <HStack justifyContent={'space-between'} alignItems={'flex-start'}>
            <Link
              asChild
              data-umami-event={utm_content}
              data-umami-event-label={utm_content ? list.slug : undefined}
              color={color.isLight() ? 'blackAlpha.800' : undefined}
              fontWeight="bold"
              lineClamp={2}
            >
              <NextLink href={getListLink(list)} prefetch={false}>
                {list.name}
              </NextLink>
            </Link>
            <HStack>
              {list.visibility !== 'private' && (
                <IconButton
                  onClick={copyLink}
                  data-umami-event="copy-link"
                  size="2xs"
                  variant="subtle"
                  colorPalette="whiteAlpha"
                  aria-label="Share Link"
                >
                  <FaShareAlt />
                </IconButton>
              )}
              {canEdit && (
                <IconButton
                  onClick={onToggle}
                  size="2xs"
                  variant="subtle"
                  colorPalette="whiteAlpha"
                  aria-label="Edit List"
                >
                  <FaPencilAlt />
                </IconButton>
              )}
            </HStack>
          </HStack>
          <Text
            fontSize="xs"
            color={color.isLight() ? 'blackAlpha.700' : undefined}
            flex={1}
            lineClamp={4}
            as="div"
            css={{ '& a': { fontWeight: 'bold', color: 'inherit' } }}
          >
            <Markdown>
              {(list.description || t('ItemPage.list-no-description')).split(/[\r\n]+/)[0]}
            </Markdown>
          </Text>
          <Flex gap={1} flexWrap="wrap">
            {!!list.dynamicType && (
              <Badge
                colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'}
                display="inline-flex"
                ml={1}
                p={'2px'}
                alignItems={'center'}
                variant="solid"
              >
                <Image src={DynamicIcon} alt="Dynamic List" w={'8px'} />
              </Badge>
            )}
            {list.official && (
              <Badge asChild colorPalette="blue" variant="solid">
                <NextLink href="/lists/official" prefetch={false}>
                  ✓ {t('General.official')}
                </NextLink>
              </Badge>
            )}

            {!list.official && list.visibility !== 'public' && (
              <Badge colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'} variant="solid">
                <ListVisibility visibility={list.visibility} />
              </Badge>
            )}

            {!list.official && list.purpose !== 'none' && (
              <Badge colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'} variant="solid">
                <ListPurpose purpose={list.purpose} />
              </Badge>
            )}

            <Badge colorPalette={color.isLight() ? 'blackAlpha' : 'gray'} variant="solid">
              {formatter.number(list.itemCount ?? 0)} {t('General.items')}
            </Badge>

            {!list.official && list.purpose === 'trading' && !!matchCount && (
              <Badge colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'} variant="solid">
                {t('Lists.list-want', { matchCount })}
              </Badge>
            )}
            {!list.official && list.purpose === 'seeking' && !!matchCount && (
              <Badge colorPalette={color.isLight() ? 'blackAlpha' : 'whiteAlpha'} variant="solid">
                {t('Lists.list-have', { matchCount })}
              </Badge>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default UserListCard;

// These components are used to prevent using t("Lists." + variable)
// which would not be tree-shaken by our itemdb-intl plugin
const ListVisibility = ({ visibility }: { visibility: 'private' | 'unlisted' }) => {
  const t = useTranslations();

  const translation = {
    private: t('Lists.private'),
    unlisted: t('Lists.unlisted'),
  };

  return translation[visibility];
};

const ListPurpose = ({ purpose }: { purpose: 'seeking' | 'trading' | 'none' }) => {
  const t = useTranslations();

  const translation = {
    seeking: t('Lists.seeking'),
    trading: t('Lists.trading'),
    none: t('Lists.none'),
  };

  return translation[purpose];
};

export const getListLink = (list: UserList) => {
  if (list.dynamicType === 'search') {
    return `/search?list_id=${list.internal_id}`;
  }

  return `/lists/${list.official ? 'official' : list.owner.username}/${list.slug ?? list.internal_id}`;
};
