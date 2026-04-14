/* eslint-disable react/no-unescaped-entities */
import {
  Heading,
  Text,
  Link,
  Center,
  Image,
  Box,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import Layout from '../components/Layout';
import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';
import { FeedbackButton } from '@components/Modal/FeedbackModal';
import { getFolderMeta } from '@utils/googleCloud';

type RawExportPageProps = {
  messages: Record<string, string>;
  dumps: ExportData[];
};

const RawDataPage = (props: RawExportPageProps) => {
  const { dumps } = props;
  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,hsla(215, 31.80%, 56.30%, 0.70) 70%)`}
        zIndex={-1}
      />
      <Center mt={8} flexFlow="column" gap={2} sx={{ a: { color: 'blue.300' } }} textAlign="center">
        <Image
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_homestructure.png"
          borderRadius={'md'}
          boxShadow={'md'}
          alt="sad wocky 404"
        />
        <Heading>itemdb's Public Data</Heading>
        <Text>
          We provide some data for public use. This data is provided as-is and may not be up to
          date, complete or accurate.
        </Text>
        <Text>
          By using this data, you agree to our <Link href="/terms">Terms of Service</Link> and
          comply with the{' '}
          <Link href="https://www.mozilla.org/en-US/MPL/2.0/" isExternal>
            MPL-2.0 license
          </Link>
          .
        </Text>
        <Text>
          You can also check out our <Link href="https://docs.itemdb.com.br">API</Link> for general
          uses.
        </Text>
        <TableContainer
          mt={8}
          bg="blackAlpha.500"
          w="100%"
          sx={{ a: { color: 'blue.200' } }}
          maxW={'1000px'}
          borderRadius="md"
          fontSize="sm"
        >
          <Table>
            <Thead>
              <Tr>
                <Th>File</Th>
                <Th>Description</Th>
                <Th>Date</Th>
                <Th>Size</Th>
                <Th>Format</Th>
                <Th>Auto Update?</Th>
              </Tr>
            </Thead>
            <Tbody>
              {[...dumps, ...rawExportData].map((data, i) => (
                <Tr key={i}>
                  <Td>
                    <Link href={data.link} isExternal>
                      {data.name}
                    </Link>
                  </Td>
                  <Td fontSize="xs" whiteSpace={'normal'}>
                    {data.description}
                  </Td>
                  <Td>{data.date}</Td>
                  <Td>{data.size}</Td>
                  <Td>{data.format}</Td>
                  <Td>{data.update ?? 'No'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <FeedbackButton mt={5} />
      </Center>
    </>
  );
};

export default RawDataPage;

export async function getServerSideProps(context: any) {
  const x = await getFolderMeta('dumps/');

  const exportDataFromS3 = x.map(S3ToExportData).filter((data) => data !== null);

  return {
    props: {
      dumps: exportDataFromS3,
      messages: await loadTranslation(context.locale, 'public-data'),
    },
  };
}

RawDataPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout SEO={{ title: 'itemdb Public Data', noindex: true }} mainColor="#6c8ab3c7">
      {page}
    </Layout>
  );
};

type ExportData = {
  name: string;
  description: string;
  date: string;
  size: string;
  format: string;
  link: string;
  update?: string;
};

const rawExportData: ExportData[] = [
  {
    name: "itemdb's db dump",
    description:
      "A dump of itemdb's database, including items, colors and prices. Useful if you want to run your own clone of itemdb.",
    date: '2025-08-20',
    size: '97.5MB',
    format: 'zip, sql',
    link: 'https://cdn.itemdb.com.br/raw/itemdb-dump-2025-08-20.zip',
  },
  {
    name: "itemdb's Restock History",
    description: "A dump of all restocks reports in itemdb's database.",
    date: '2024-04-14',
    size: '130MB',
    format: 'zip, csv',
    link: 'https://firebasestorage.googleapis.com/v0/b/itemdb-1db58.appspot.com/o/raw%2Fitemdb_restockHistory_20240414.zip?alt=media&token=c1606c35-e8d1-4b23-9158-5aa374101409',
  },
];

const S3ToExportData = (data: {
  Key: string | undefined;
  LastModified: Date | undefined;
  Size: number | undefined;
}): ExportData | null => {
  const dataMap = {
    items: {
      name: 'Item Data',
      description:
        "A dump of all items in itemdb's database. Does not include prices or other data. Useful for setting up your own itemdb instance or for data analysis.",
      format: 'gzip, sql',
      update: 'Every Month',
    },
    itemcolor: {
      name: 'Item Colors',
      description:
        "A dump of all item colors in itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
      format: 'gzip, sql',
      update: 'Every Month',
    },
    itemprices: {
      name: 'Item Prices',
      description:
        "A dump of all price history in itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
      format: 'gzip, sql',
      update: 'Every 3 Months',
    },
  };

  const key = data.Key?.split('/').pop()?.split('.')[0].toLowerCase() ?? 'unknown';
  const mappedData = dataMap[key as keyof typeof dataMap];

  if (!mappedData) return null;

  return {
    name: mappedData.name,
    description: mappedData.description,
    format: mappedData.format,
    size: data.Size ? `${(data.Size / (1024 * 1024)).toFixed(2)}MB` : 'unknown',
    date: data.LastModified?.toISOString().split('T')[0] ?? 'unknown',
    link: `https://cdn.itemdb.com.br/${data.Key}`,
    update: mappedData.update,
  };
};
