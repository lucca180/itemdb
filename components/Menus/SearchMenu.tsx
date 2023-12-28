import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, IconButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const SearchMenu = () => {
  const t = useTranslations('Layout');
  return (
    <Menu>
      <MenuButton size="sm" as={IconButton}>
        <ChevronDownIcon boxSize="20px" />
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuItem as={Link} href="/search">
            {t('advanced-search')}
          </MenuItem>
          <MenuItem as={Link} href="/lists/official">
            {t('official-lists')}
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SearchMenu;
