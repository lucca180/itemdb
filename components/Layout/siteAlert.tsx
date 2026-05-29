import type { ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { connection } from 'next/server';
import { appLoadTranslation } from '@utils/load-translation';
import { getCurrentSiteAlert } from '@utils/siteAlert';
import type { SiteAlertConfig } from '@utils/siteAlert';

export function SiteAlertBar({ alert, children }: { alert: SiteAlertConfig; children: ReactNode }) {
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
          <Link
            prefetch={false}
            href={alert.link}
            style={{ display: 'inline-flex' }}
            data-umami-event="site-alert-click"
            data-umami-event-label={alert.message}
          >
            <Image src={alert.img.src} width={alert.img.w} height={alert.img.h} alt="alert icon" />
          </Link>
        )}
        <Text as="p" color={alert.color}>
          {children}
        </Text>
      </Flex>
    </Flex>
  );
}

type AppSiteAlertProps = {
  locale: string;
};

export async function AppSiteAlert({ locale }: AppSiteAlertProps) {
  await connection();
  const messages = await appLoadTranslation(locale);
  const t = createTranslator({ messages, locale });
  const alert = getCurrentSiteAlert();

  return (
    <SiteAlertBar alert={alert}>
      {!!alert.message &&
        t.rich(`SiteAlert.${alert.message}`, {
          b: (children) => <b>{children}</b>,
          Link: (children) => (
            <Link
              prefetch={false}
              href={alert.link}
              style={{ fontWeight: 'bold' }}
              target={alert.link.startsWith('http') ? '_blank' : undefined}
              data-umami-event="site-alert-click"
              data-umami-event-label={alert.message}
            >
              {children}
            </Link>
          ),
        })}
    </SiteAlertBar>
  );
}
