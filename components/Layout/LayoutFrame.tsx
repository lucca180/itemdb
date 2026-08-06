import type { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';

export const LAYOUT_BASE_COLOR = '#4A5568';
/** Default nav tint (with alpha), shared by App layout + SetMainColor cleanup. */
export const LAYOUT_MAIN_COLOR_DEFAULT = '#4A5568c7';
export const LAYOUT_MAIN_COLOR_CSS_VAR = '--layout-main-color';

type LayoutFrameProps = {
  children?: ReactNode;
  siteAlert?: ReactNode;
  logo: ReactNode;
  search: ReactNode;
  auth: ReactNode;
  navigation: ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
  mainMinH?: string;
};

export function LayoutFrame({
  children,
  siteAlert,
  logo,
  search,
  auth,
  navigation,
  footer,
  fullWidth,
  mainMinH,
}: LayoutFrameProps) {
  return (
    <Flex flexFlow="column" minH="100vh">
      {siteAlert}
      <Flex
        as="header"
        w="full"
        maxW="8xl"
        marginX="auto"
        gap={{ base: 2, md: 4 }}
        px={{ base: 2, md: 4 }}
        py={5}
      >
        {logo}
        <Flex flex="1 1 auto" justifyContent="center" alignItems="center" minW={0}>
          <Box maxW="650px" h="100%" flex="1" minW={0} w="100%" overflow="hidden">
            {search}
          </Box>
        </Flex>
        {auth}
      </Flex>

      <Flex
        as="nav"
        bg={`var(${LAYOUT_MAIN_COLOR_CSS_VAR})`}
        justifyContent="center"
        alignItems="center"
        py={1}
        gap={{ base: 1, md: 3 }}
        overflowX="auto"
      >
        <Flex margin="0 auto" maxW="100%" alignItems="center" py={1} gap={{ base: 1, md: 3 }}>
          {navigation}
        </Flex>
      </Flex>

      <Box
        as="main"
        flex="1"
        w="full"
        maxW={fullWidth ? undefined : '8xl'}
        marginX="auto"
        px={fullWidth ? undefined : 4}
        pb={6}
        h="100%"
        minH={mainMinH}
      >
        {children}
      </Box>

      {footer}
    </Flex>
  );
}
