import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, IconButton, MenuList, MenuItem } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import ClientPortal from '@components/Utils/ClientPortal';

const SearchMenu = () => {
  const t = useTranslations();
  return (
    <Menu>
      <MenuButton size="sm" as={IconButton} data-umami-event="search-menu-button">
        <ChevronDownIcon boxSize="20px" />
      </MenuButton>
      <ClientPortal>
        <MenuList>
          <MenuItem as={Link} href="/search" prefetch={false}>
            {t('Layout.advanced-search')}
          </MenuItem>
          <MenuItem as={Link} href="/lists/official" prefetch={false}>
            {t('Layout.official-lists')}
          </MenuItem>
        </MenuList>
      </ClientPortal>
    </Menu>
  );
};

export default SearchMenu;
