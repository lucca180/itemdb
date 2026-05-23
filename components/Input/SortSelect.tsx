import { ChevronDownIcon } from '@utils/styling/chakraIcons';
import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { AiOutlineArrowUp } from 'react-icons/ai';

type Props = {
  sortTypes: { [key: string]: string };
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onClick: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  disabled?: boolean;
};

export const SortSelect = (props: Props) => {
  const t = useTranslations();
  const { sortTypes, sortBy, disabled } = props;

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
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button disabled={disabled}>
          {t('SortTypes.' + sortTypes[sortBy])}
          <ChevronDownIcon />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {Object.entries(sortTypes).map(([key, val]) => (
              <Menu.Item key={key} value={key} onClick={() => onclick(key)}>
                <Box flex="1">{t('SortTypes.' + val)}</Box>
                {key === sortBy && arrow}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
