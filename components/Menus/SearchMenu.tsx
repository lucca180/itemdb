import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  Portal,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

const SearchMenu = () => {
  const router = useRouter();

  const goTo = (path: string) => {
    router.push(path);
  };

  return (
    <Menu>
      <MenuButton size="sm" as={IconButton}>
        <ChevronDownIcon boxSize="20px" />
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuItem onClick={() => goTo('/search')}>Advanced Search</MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SearchMenu;
