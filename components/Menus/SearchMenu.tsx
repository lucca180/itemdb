import { ChevronDownIcon } from '@utils/chakraIcons';
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
          size="sm"
          data-umami-event="search-menu-button"
          aria-label={t('Layout.advanced-search')}
        >
          <ChevronDownIcon boxSize="20px" />
        </IconButton>
      </Menu.Trigger>
      <ClientPortal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="advanced-search" asChild>
              <Link href="/search" prefetch={false}>
                {t('Layout.advanced-search')}
              </Link>
            </Menu.Item>
            <Menu.Item value="official-lists" asChild>
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
