import { ChevronDownIcon } from '@utils/styling/chakraIcons';
import { Menu, IconButton } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import ClientPortal from '@components/Utils/ClientPortal';

const SearchMenu = () => {
  const t = useTranslations();
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          size="xs"
          colorPalette="whiteAlpha"
          variant="subtle"
          data-umami-event="search-menu-button"
          aria-label={t('Layout.advanced-search')}
        >
          <ChevronDownIcon boxSize="20px" />
        </IconButton>
      </Menu.Trigger>
      <ClientPortal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="advanced-search"
              asChild
              _hover={{ bg: 'blackAlpha.400' }}
              cursor="pointer"
            >
              <Link href="/search" prefetch={false}>
                {t('Layout.advanced-search')}
              </Link>
            </Menu.Item>
            <Menu.Item
              value="official-lists"
              asChild
              _hover={{ bg: 'blackAlpha.400' }}
              cursor="pointer"
            >
              <Link href="/lists/official" prefetch={false}>
                {t('Layout.official-lists')}
              </Link>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </ClientPortal>
    </Menu.Root>
  );
};

export default SearchMenu;
