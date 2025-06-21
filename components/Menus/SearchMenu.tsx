import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, IconButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const SearchMenu = () => {
  const t = useTranslations();
  return (
    <Menu>
      <MenuButton size="sm" as={IconButton} data-umami-event="search-menu-button">
        <ChevronDownIcon boxSize="20px" />
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuItem as={Link} href="/search">
            {t('Layout.advanced-search')}
          </MenuItem>
          <MenuItem as={Link} href="/lists/official">
            {t('Layout.official-lists')}
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SearchMenu;
