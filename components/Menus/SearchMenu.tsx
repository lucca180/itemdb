import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

const SearchMenu = () => {
  const router = useRouter();

  const goTo = (path: string) => {
    router.push(path);
  };

  return (
    <Menu>
      <MenuButton as={IconButton}>
        <ChevronDownIcon />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => goTo('/search')}>Advanced Search</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default SearchMenu;
