import type { ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { siteAlerts } from '@utils/siteAlert';
import type { SiteAlertConfig } from '@utils/siteAlert';
import { isLocalizableHref } from '@utils/locales';

export type SiteAlertProps = {
  alert?: SiteAlertConfig;
  children?: ReactNode;
  linkHref?: string;
};

export function SiteAlertBar({ alert, children, linkHref }: SiteAlertProps) {
  alert = alert || siteAlerts.default;
  const href = linkHref ?? alert.link;
  const isExternal = !isLocalizableHref(href);

  return (
    <Flex bg={alert.bg}>
      <Flex
        w="full"
        maxW="8xl"
        marginX="auto"
        alignItems="center"
        gap={1}
        fontSize="xs"
        minH="30px"
        px={1}
      >
        {alert.img && (
          <a
            href={href}
            style={{ display: 'inline-flex' }}
            data-umami-event="site-alert-click"
            data-umami-event-label={alert.message}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            <Image src={alert.img.src} width={alert.img.w} height={alert.img.h} alt="alert icon" />
          </a>
        )}

        <Text as="p" color={alert.color}>
          {children}
        </Text>
      </Flex>
    </Flex>
  );
}
