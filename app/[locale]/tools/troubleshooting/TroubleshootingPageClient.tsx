'use client';

import { ReactNode } from 'react';
import { Text, Flex, Alert } from '@chakra-ui/react';
import { DETECTABLE_SCRIPTS, useScriptStatus } from '@utils/scriptUtils';
import MainLink from '@components/Utils/MainLink';
import { useAuth } from '@utils/auth';
import type { TroubleshootingPageProps } from './buildTroubleshootingPageProps';

type StatusCheckProps = {
  title: string;
  status: 'error' | 'info' | 'warning' | 'success';
  description?: string | ReactNode;
};

const StatusCheck = ({ title, status, description }: StatusCheckProps) => {
  return (
    <Alert.Root status={status} bg="transparent">
      <Alert.Indicator />
      <Alert.Content>
        <Flex flexFlow={'column'}>
          <Alert.Title fontSize="sm">{title}</Alert.Title>
          {description && (
            <Alert.Description
              fontSize={'xs'}
              color={'whiteAlpha.700'}
              css={{
                '& a': { color: 'whiteAlpha.900' },
                'a:hover': { textDecoration: 'underline' },
              }}
            >
              {description}
            </Alert.Description>
          )}
        </Flex>
      </Alert.Content>
    </Alert.Root>
  );
};

const ScriptStatus = () => {
  const { isLoading, scriptStatus } = useScriptStatus();

  if (isLoading) return <StatusCheck title="Detecting your itemdb scripts..." status="info" />;

  if (!scriptStatus)
    return (
      <StatusCheck
        title="No itemdb scripts detected"
        description={
          <>
            That usually means there is an issue with your browser extension. Please check our{' '}
            <MainLink href="/articles/help-my-scripts-are-not-working">
              Scripts Not Working
            </MainLink>{' '}
            article
          </>
        }
        status="error"
      />
    );

  const outdatedScripts = Object.values(scriptStatus)
    .filter((s) => s.status === 'outdated')
    .map((s) => s.name);

  if (outdatedScripts.length > 0) {
    return (
      <StatusCheck
        title={'Outdated Scripts detected'}
        description={
          <>
            The following scripts are outdated: {outdatedScripts.join(', ')}. Please update them to
            the latest version <MainLink href="/articles/userscripts">here</MainLink>.
          </>
        }
        status="warning"
      />
    );
  }

  const scriptNames = Object.values(scriptStatus)
    .filter((s) => s.status !== 'notFound')
    .map((s) => s.name)
    .join(', ');

  return (
    <StatusCheck
      title="itemdb scripts detected"
      description={'Detected scripts: ' + scriptNames}
      status="success"
    />
  );
};

const SessionStatus = ({ hasSession }: { hasSession: boolean }) => {
  if (!hasSession && typeof window !== 'undefined' && !navigator.cookieEnabled)
    return (
      <StatusCheck
        title="Cookies are disabled"
        description="Please enable cookies for itemdb to function properly."
        status="error"
      />
    );

  if (!hasSession)
    return (
      <StatusCheck
        title="No valid session cookie found"
        description={
          <>
            You may need to visit itemdb every now and then for your scripts to function properly.
            Please refresh the page and try again.
          </>
        }
        status="error"
      />
    );

  return <StatusCheck title="Valid session cookie found" status="success" />;
};

const IpBanStatus = ({ isIpBan }: { isIpBan: boolean }) => {
  if (isIpBan)
    return (
      <StatusCheck
        title="Rate limit exceeded"
        description={
          <>
            You have exceeded the item request limit. Please wait a few hours and try using your
            scripts again. You can continue browsing itemdb.com.br
          </>
        }
        status="error"
      />
    );

  return <StatusCheck title="No API restrictions found" status="success" />;
};

const AccountStatus = () => {
  const { user, authLoading } = useAuth();

  if (authLoading) return <StatusCheck title="Checking itemdb account status..." status="info" />;

  if (!user)
    return (
      <StatusCheck
        title="Not logged in"
        description={
          <>
            You are not logged in. Signed in users have higher limits. Try creating an itemdb
            account.
          </>
        }
        status="warning"
      />
    );

  if (user.banned)
    return (
      <StatusCheck
        title="Account restrictions"
        description={<>Your itemdb account has some restrictions due to suspicious activity.</>}
        status="warning"
      />
    );

  return <StatusCheck title="itemdb account in good standing" status="success" />;
};

const BrowserStatus = ({ isBrowser }: { isBrowser: boolean }) => {
  if (!isBrowser)
    return (
      <StatusCheck
        title="Browser not supported"
        description={
          <>
            Your browser might not be supported for itemdb scripts. Please try using a different
            browser.
          </>
        }
        status="error"
      />
    );

  return <StatusCheck title="Browser looks good" status="success" />;
};

export function TroubleshootingPageClient({
  isBrowser,
  hasSession,
  isIpBan,
}: TroubleshootingPageProps) {
  return (
    <Flex
      flexFlow={'column'}
      bg={'blackAlpha.500'}
      p={4}
      borderRadius={'md'}
      shadow={'md'}
      gap={3}
      w={'100%'}
    >
      <ScriptStatus />
      <SessionStatus hasSession={hasSession} />
      <IpBanStatus isIpBan={isIpBan} />
      <AccountStatus />
      <BrowserStatus isBrowser={isBrowser} />
      <Text fontSize={'xs'} color={'whiteAlpha.700'}>
        If everything looks good but your scripts are still not working, try disabling every
        userscript except the one you&apos;re trying to use and refresh the page.
      </Text>
      <Text fontSize={'xs'} color={'whiteAlpha.700'}>
        <b>
          At the moment, only the latest version of the following scripts are detectable by this
          tool:
        </b>
        <br />
        {DETECTABLE_SCRIPTS.join(', ')}
      </Text>
    </Flex>
  );
}
