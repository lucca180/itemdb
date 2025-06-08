import {
  Badge,
  Flex,
  Link,
  Text,
  IconButton,
  Image as ChakraImg,
  HStack,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { ListItemInfo, UserList } from '../../types';
import icon from '../../public/logo_icon.svg';
import DynamicIcon from '../../public/icons/dynamic.png';
import Color from 'color';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
  const toast = useToast();
  const { list, matches, isSelected, disableLink, utm_content, isSmall, canEdit } = props;
  const { isOpen, onToggle } = useDisclosure();
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
      title: t('General.link-copied'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      {canEdit && isOpen && (
        <CreateListModal list={list} isOpen={isOpen} onClose={onToggle} refresh={props.refresh} />
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
        boxShadow={isSelected ? 'outline' : undefined}
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 0%)`}
        pointerEvents={disableLink ? 'none' : 'initial'}
      >
        <Link
          as={NextLink}
          href={`/lists/${list.official ? 'official' : list.owner.username}/${
            list.slug ?? list.internal_id
          }${utm_content ? `?utm_content=${utm_content}` : ''}`}
          prefetch={false}
          _hover={{ textDecoration: 'none' }}
        >
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
            boxShadow={isSelected ? 'outline' : 'md'}
            justifyContent="center"
            alignItems="center"
          >
            {!list.coverURL && (
              <Image src={icon} width={75} style={{ opacity: 0.85 }} alt={'List Cover'} />
            )}

            {list.coverURL && (
              <Image
                quality={90}
                as={list.official ? undefined : ChakraImg}
                src={list.coverURL}
                width={140}
                height={140}
                w={{ base: '95px', sm: isSmall ? '95px' : '140px' }}
                h={{ base: '95px', sm: isSmall ? '95px' : '140px' }}
                alt={'List Cover'}
                objectFit="cover"
                borderRadius="md"
              />
            )}
          </Flex>
        </Link>
        <Flex flexFlow="column" gap={2} w="100%">
          <HStack justifyContent={'space-between'} alignItems={'flex-start'}>
            <Text
              fontWeight="bold"
              noOfLines={2}
              color={color.isLight() ? 'blackAlpha.800' : undefined}
            >
              <Link
                as={NextLink}
                href={`/lists/${list.official ? 'official' : list.owner.username}/${
                  list.slug ?? list.internal_id
                }${utm_content ? `?utm_content=${utm_content}` : ''}`}
                prefetch={false}
              >
                {list.name}
              </Link>
            </Text>
            <HStack>
              {list.visibility !== 'private' && (
                <IconButton
                  onClick={copyLink}
                  data-umami-event="copy-link"
                  size="xs"
                  aria-label="Share Link"
                  icon={<FaShareAlt />}
                />
              )}
              {canEdit && (
                <IconButton
                  onClick={onToggle}
                  size="xs"
                  aria-label="Edit List"
                  icon={<FaPencilAlt />}
                />
              )}
            </HStack>
          </HStack>
          <Text
            fontSize="xs"
            color={color.isLight() ? 'blackAlpha.700' : undefined}
            flex={1}
            noOfLines={4}
            as="div"
            sx={{ a: { fontWeight: 'bold' } }}
          >
            <Markdown>
              {(list.description || t('ItemPage.list-no-description')).split(/[\r\n]+/)[0]}
            </Markdown>
          </Text>
          <Flex gap={1} flexWrap="wrap">
            {!!list.dynamicType && (
              <Badge
                colorScheme={color.isLight() ? 'black' : 'orange'}
                display="inline-flex"
                ml={1}
                p={'2px'}
                alignItems={'center'}
              >
                <Image src={DynamicIcon} alt="Dynamic List" w={'8px'} />
              </Badge>
            )}
            {list.official && (
              <Badge
                as={NextLink}
                href="/lists/official"
                prefetch={false}
                colorScheme="blue"
                variant="solid"
              >
                ✓ {t('General.official')}
              </Badge>
            )}

            {list.visibility !== 'public' && (
              <Badge colorScheme={color.isLight() ? 'black' : 'gray'}>
                {t('Lists.' + list.visibility)}
              </Badge>
            )}

            {!list.official && list.purpose !== 'none' && (
              <Badge colorScheme={color.isLight() ? 'black' : 'gray'}>
                {t('Lists.' + list.purpose)}
              </Badge>
            )}

            <Badge colorScheme={color.isLight() ? 'black' : 'gray'}>
              {list.itemCount} {t('General.items')}
            </Badge>

            {!list.official && list.purpose === 'trading' && !!matchCount && (
              <Badge colorScheme={color.isLight() ? 'black' : 'gray'}>
                {t('Lists.list-want', { matchCount })}
              </Badge>
            )}
            {!list.official && list.purpose === 'seeking' && !!matchCount && (
              <Badge colorScheme={color.isLight() ? 'black' : 'gray'}>
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
