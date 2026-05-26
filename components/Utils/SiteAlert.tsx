import { Flex, Text, Link } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import NextLink from 'next/link';
import { getCurrentSiteAlert } from '@utils/siteAlert';

export const SiteAlert = () => {
  const t = useTranslations();
  const alert = getCurrentSiteAlert();

  return (
    <Flex bg={alert.bg}>
      <Flex
        w="full"
        maxW="8xl"
        marginX="auto"
        alignItems={'center'}
        gap={1}
        fontSize={'xs'}
        minH={'30px'}
        px={1}
      >
        {alert.img && (
          <Link asChild data-umami-event="site-alert-click" data-umami-event-label={alert.message}>
            <NextLink href={alert.link}>
              <Image
                src={alert.img.src}
                width={alert.img.w}
                height={alert.img.h}
                alt="alert icon"
              />
            </NextLink>
          </Link>
        )}
        <Text color={alert.color}>
          {!!alert.message &&
            t.rich('SiteAlert.' + alert.message, {
              b: (children) => <b>{children}</b>,
              Link: (children) => (
                <Link
                  asChild
                  fontWeight="bold"
                  data-umami-event="site-alert-click"
                  data-umami-event-label={alert.message}
                >
                  <NextLink href={alert.link} target="_blank" rel="noreferrer">
                    {children}
                  </NextLink>
                </Link>
              ),
            })}
        </Text>
      </Flex>
    </Flex>
  );
};
