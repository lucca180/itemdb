import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, IconButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import Link from 'next/link';

const SearchMenu = () => {
  return (
    <Menu>
      <MenuButton size="sm" as={IconButton}>
        <ChevronDownIcon boxSize="20px" />
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuItem as={Link} href="/search">
            Advanced Search
          </MenuItem>
          <MenuItem as={Link} href="/lists/official">
            Official Lists
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SearchMenu;
