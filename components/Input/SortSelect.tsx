import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, Button, MenuList, MenuItem } from '@chakra-ui/react';
import { AiOutlineArrowUp } from 'react-icons/ai';

type Props = {
  sortTypes: { [key: string]: string };
  sortBy: string;
  sortDir: string;
  onClick: (sortBy: string, sortDir: string) => void;
};

export const SortSelect = (props: Props) => {
  const { sortTypes, sortBy } = props;

  const arrow =
    props.sortDir === 'asc' ? (
      <AiOutlineArrowUp style={{ marginLeft: 'auto' }} />
    ) : (
      <AiOutlineArrowUp style={{ transform: 'rotate(180deg)', marginLeft: 'auto' }} />
    );

  const onclick = (val: string) => {
    if (val === sortBy) {
      props.onClick(val, props.sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      props.onClick(val, props.sortDir);
    }
  };

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
        {sortTypes[sortBy]}
      </MenuButton>
      <MenuList>
        {Object.entries(sortTypes).map(([key, val]) => (
          <MenuItem key={key} value={key} onClick={() => onclick(key)}>
            {val} {key === sortBy && arrow}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
