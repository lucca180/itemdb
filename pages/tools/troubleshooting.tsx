import {
  Heading,
  Text,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
} from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { ReactElement, ReactNode } from 'react';
import { NextApiRequest, GetServerSidePropsContext } from 'next';
import { CheckAuth } from '../../utils/googleCloud';
import { loadTranslation } from '@utils/load-translation';
import * as Redis from '@utils/redis';
import requestIp from 'request-ip';
import { isLikelyBrowser, normalizeIP } from '@utils/api-utils';
import { checkSession } from '@utils/redis';
import { DETECTABLE_SCRIPTS, useScriptStatus } from '@utils/scriptUtils';
import Link from 'next/link';
import { useAuth } from '@utils/auth';

type TroubleshootingPageProps = {
  isBrowser: boolean;
  hasSession: boolean;
  isIpBan: boolean;
  messages: Record<string, string>;
  locale: string;
};

const TroubleshootingPage = (props: TroubleshootingPageProps) => {
  const { isBrowser, hasSession, isIpBan } = props;

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/betterthanyou/contestant245.gif',
          alt: '',
        }}
        color="#ad3e8c"
      >
        <Heading as="h1" size="lg">
          Script Troubleshooting Tool
        </Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Your itemdb userscripts are not working? Use this tool to help us figure out what the
          issue is!
        </Text>
      </HeaderCard>
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
    </>
  );
};

export default TroubleshootingPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let hasUser = false;
  try {
    const check = await CheckAuth(context.req as NextApiRequest);
    hasUser = !!check.user;
  } catch {}

  // check session
  const sessionCookie = context.req.cookies['idb-session-id'];
  const hasSession = !!checkSession(sessionCookie ?? '');

  // check ip ban
  let isIpBan = false;
  try {
    let ip = requestIp.getClientIp(context.req as any) ?? null;
    ip = ip ? normalizeIP(ip) : null;
    if (ip) await Redis.checkBan(ip);
  } catch (e) {
    if (e === Redis.API_ERROR_CODES.limitExceeded) {
      isIpBan = true;
    }
  }

  const isBrowser = isLikelyBrowser(context.req as NextApiRequest);
  return {
    props: {
      isBrowser,
      hasUser,
      hasSession,
      isIpBan,
      messages: await loadTranslation(context.locale as string, 'tools/troubleshooting'),
      locale: context.locale,
    },
  };
}

TroubleshootingPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout
      SEO={{
        title: 'Troubleshooting Tool',
        noindex: true,
      }}
      mainColor="#ad3e8cc7"
    >
      {page}
    </Layout>
  );
};

type StatusCheckProps = {
  title: string;
  status: 'error' | 'info' | 'warning' | 'success' | 'loading';
  description?: string | ReactNode;
};

const StatusCheck = (props: StatusCheckProps) => {
  const { title, status, description } = props;
  return (
    <>
      <Alert status={status} bg="transparent">
        <AlertIcon />
        <Flex flexFlow={'column'}>
          <AlertTitle fontSize="sm">{title}</AlertTitle>
          {description && (
            <AlertDescription
              fontSize={'xs'}
              color={'whiteAlpha.700'}
              sx={{ a: { color: 'whiteAlpha.900' }, 'a:hover': { textDecoration: 'underline' } }}
            >
              {description}
            </AlertDescription>
          )}
        </Flex>
      </Alert>
    </>
  );
};

// ------ checks ------ //

const ScriptStatus = () => {
  const { isLoading, scriptStatus } = useScriptStatus();

  if (isLoading) return <StatusCheck title="Detecting your itemdb scripts..." status="loading" />;

  if (!scriptStatus)
    return (
      <StatusCheck
        title="No itemdb scripts detected"
        description={
          <>
            That usually means there is an issue with your browser extension. Please check our{' '}
            <Link href="/articles/help-my-scripts-are-not-working">Scripts Not Working</Link>{' '}
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
            the latest version <Link href="/articles/userscripts">here</Link>.
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

const SessionStatus = ({ hasSession }: { hasSession: boolean | null }) => {
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

  if (authLoading)
    return <StatusCheck title="Checking itemdb account status..." status="loading" />;

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
