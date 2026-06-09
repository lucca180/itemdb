'use client';

import type { ReactNode } from 'react';
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { AuthButtonSkeleton } from '@components/Layout/AuthButtonSkeleton';
import { LAYOUT_BASE_COLOR, LayoutFrame } from '@components/Layout/LayoutFrame';
import { LayoutLogoContent } from '@components/Layout/LayoutLogoContent';
import { getLayoutNavSections } from '@components/Layout/layoutData';
import { SiteAlertBar } from './SiteAlertBar';

export type AppServerLayoutSkeletonProps = {
  children?: ReactNode;
  mainColor?: string;
  fullWidth?: boolean;
};

export default function AppServerLayoutSkeleton({
  children,
  mainColor = LAYOUT_BASE_COLOR,
  fullWidth,
}: AppServerLayoutSkeletonProps) {
  const t = useTranslations();
  const navSections = getLayoutNavSections((key) => t(key));

  return (
    <Box aria-hidden="true">
      <LayoutFrame
        siteAlert={<SiteAlertBar />}
        logo={
          <Box flex="0 0 auto">
            <LayoutLogoContent />
          </Box>
        }
        search={<Skeleton h="40px" w="full" borderRadius="md" />}
        auth={<AuthButtonSkeleton />}
        navigation={navSections.map((section) => (
          <Skeleton key={section.href} borderRadius="md" bg="blackAlpha.400">
            <Flex h={8} px={3} alignItems="center">
              <Text fontSize={{ base: 'xs', sm: 'sm' }} whiteSpace="nowrap">
                {section.label}
              </Text>
            </Flex>
          </Skeleton>
        ))}
        mainColor={mainColor}
        fullWidth={fullWidth}
        mainMinH={children ? undefined : '100vh'}
      >
        {children}
      </LayoutFrame>
    </Box>
  );
}
