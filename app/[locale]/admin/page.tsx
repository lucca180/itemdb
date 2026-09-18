import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { Suspense } from 'react';
import { Center, Grid, Heading, Link, Text } from '@chakra-ui/react';
import { MdAddCircle, MdOutlineEditNote, MdOutlineFactCheck, MdShowChart } from 'react-icons/md';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import FeatureCard from '@components/Card/FeatureCard';
import MainLink from '@components/Utils/MainLink';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';

const mainColor = '#4A5568c7';

type AdminTool = {
  href: string;
  title: string;
  description: string;
  icon: ReactElement;
  color: string;
};

const adminTools: AdminTool[] = [
  {
    href: '/admin/manual-check',
    title: 'Manual Check Queue',
    description:
      "Triage pending item merge-conflict submissions (renames and re-arts) that couldn't be merged automatically.",
    icon: <MdOutlineFactCheck />,
    color: '#8f5573',
  },
  {
    href: '/admin/price-markers',
    title: 'Manual Price Markers',
    description:
      'Add manual markers (events, restocks, availability windows) to an item price history.',
    icon: <MdShowChart />,
    color: '#8f5573',
  },
  {
    href: '/admin/bulk-price-context',
    title: 'Bulk Price Context',
    description: 'Add context to the first price of selected items after a chosen date.',
    icon: <MdOutlineEditNote />,
    color: '#557f8f',
  },
  {
    href: '/admin/createItem',
    title: 'Create New Item',
    description: 'Manually create a new item entry in the database.',
    icon: <MdAddCircle />,
    color: '#7AB92A',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Admin',
    description: 'Hub for itemdb admin tools.',
    pathname: '/admin',
    noindex: true,
    nofollow: true,
  });
}

export default function AdminHubPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <AdminHubPageContent />
    </Suspense>
  );
}

async function AdminHubPageContent() {
  const { user } = await getServerCurrentUser();

  return (
    <>
      <SetMainColor color={mainColor} />
      {!user?.isAdmin && (
        <Center minH="60vh" flexFlow="column" gap={3} textAlign="center">
          <Heading size="md">You are not authorized to access this page.</Heading>
          <Text color="gray.400">Admin access is required.</Text>
        </Center>
      )}
      {user?.isAdmin && (
        <>
          <HeaderCard color="#4A5568">
            <Heading as="h1" size="lg">
              Admin
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Internal tools for managing itemdb data.
            </Text>
          </HeaderCard>
          <Grid templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']} gap={[3, 4, 6]}>
            {adminTools.map((tool) => (
              <Link
                asChild
                key={tool.href}
                display="block"
                h="100%"
                transition="transform 0.15s ease"
                _hover={{ textDecoration: 'none', transform: 'translateY(-3px)' }}
              >
                <MainLink href={tool.href}>
                  <FeatureCard title={tool.title} icon={tool.icon} color={tool.color}>
                    {tool.description}
                  </FeatureCard>
                </MainLink>
              </Link>
            ))}
          </Grid>
        </>
      )}
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
