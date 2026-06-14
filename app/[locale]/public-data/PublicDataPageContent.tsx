/* eslint-disable react/no-unescaped-entities */
import { Box, Center, Heading, Image, Link, Table, Text } from '@chakra-ui/react';
import { FeedbackButton } from '@components/Modal/FeedbackModal';
import MainLink from '@components/Utils/MainLink';
import type { PublicDataExport } from './publicData';

type PublicDataPageContentProps = {
  dumps: PublicDataExport[];
};

export function PublicDataPageContent({ dumps }: PublicDataPageContentProps) {
  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient="linear-gradient(to top,rgba(0,0,0,0) 0,hsla(215, 31.80%, 56.30%, 0.70) 70%)"
        zIndex={-1}
      />
      <Center
        mt={8}
        flexFlow="column"
        gap={2}
        css={{ '& a': { color: 'blue.300' } }}
        textAlign="center"
      >
        <Image
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_homestructure.png"
          borderRadius="md"
          boxShadow="md"
          alt="sad wocky 404"
        />
        <Heading>itemdb's Public Data</Heading>
        <Text>
          We provide some data for public use. This data is provided as-is and may not be up to
          date, complete or accurate.
        </Text>
        <Text>
          By using this data, you agree to our{' '}
          <Link asChild>
            <MainLink href="/terms">Terms of Service</MainLink>
          </Link>{' '}
          and comply with the{' '}
          <Link href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noreferrer">
            MPL-2.0 license
          </Link>
          .
        </Text>
        <Text>
          You can also check out our <Link href="https://docs.itemdb.com.br">API</Link> for general
          uses.
        </Text>
        <Table.ScrollArea
          mt={8}
          bg="blackAlpha.500"
          w="100%"
          css={{ '& a': { color: 'blue.200' } }}
          maxW="1000px"
          borderRadius="md"
          fontSize="sm"
        >
          <Table.Root variant="line" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>File</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Format</Table.ColumnHeader>
                <Table.ColumnHeader>Auto Update?</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {dumps
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((data) => (
                  <Table.Row key={data.link}>
                    <Table.Cell>
                      <Link href={data.link} target="_blank" rel="noreferrer">
                        {data.name}
                      </Link>
                    </Table.Cell>
                    <Table.Cell fontSize="xs" whiteSpace="normal">
                      {data.description}
                    </Table.Cell>
                    <Table.Cell>{data.date}</Table.Cell>
                    <Table.Cell>{data.size}</Table.Cell>
                    <Table.Cell>{data.format}</Table.Cell>
                    <Table.Cell>{data.update ?? 'No'}</Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
        <FeedbackButton mt={5} />
      </Center>
    </>
  );
}
