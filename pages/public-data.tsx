/* eslint-disable react/no-unescaped-entities */
import {
  Heading,
  Text,
  Link,
  Center,
  Image,
  Button,
  Icon,
  Box,
  Flex,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import Layout from '../components/Layout';
import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';
import { FeedbackButton } from '@components/Modal/FeedbackModal';

const RawDataPage = () => {
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
        <Flex my={5} gap={5} flexFlow={['column', 'row']}>
          {rawExportData.map((data, i) => (
            <Card key={i} variant={'outline'} w={'350px'}>
              <CardHeader>
                <Heading size="md">{data.name}</Heading>
              </CardHeader>
              <CardBody>
                <Text>{data.description}</Text>
              </CardBody>
              <CardFooter color={'gray'} flexFlow={'column'}>
                <Flex gap={1} justifyContent={'space-between'} fontSize={'xs'}>
                  <Text>Date: {data.date}</Text>
                  <Text>Size: {data.size}</Text>
                  <Text>Format: {data.format}</Text>
                </Flex>
                <Button as={Link} href={data.link} isExternal variant="outline" size="sm" mt={3}>
                  <Icon as={FiDownload} mr={1} /> Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Flex>
        <FeedbackButton mt={5} />
      </Center>
    </>
  );
};

export default RawDataPage;

export async function getStaticProps(context: any) {
  return {
    props: {
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

const rawExportData = [
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
    name: "itemdb's Item Data",
    description: "A dump of all items in itemdb's database. Does not include prices or other data.",
    date: '2024-04-14',
    size: '4.23MB',
    format: 'zip, csv',
    link: 'https://firebasestorage.googleapis.com/v0/b/itemdb-1db58.appspot.com/o/raw%2Fitemdb_items_20240414.zip?alt=media&token=127d4c20-0e79-4c12-8cc4-68ec68ed5aa3',
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
