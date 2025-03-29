import { Heading, Text, Flex, Center, Textarea, Divider, Button } from '@chakra-ui/react';
import Layout from '../../../components/Layout';
import { ReactElement, useState } from 'react';
import { createTranslator, useTranslations } from 'next-intl';
import HeaderCard from '../../../components/Card/HeaderCard';
import * as cheerio from 'cheerio';
import { Breadcrumbs } from '../../../components/Breadcrumbs/Breadcrumbs';

type AdvancedImportPageProps = {
  locale: string;
  messages: any;
};

const AdvancedImportPage = () => {
  const t = useTranslations();
  const [ppCode, setPPCode] = useState<string>('');
  const [itemDataJson, setItemDataJson] = useState<string>('');

  const handleChange = (value: string) => {
    let data;
    if (value.includes('I made this list on Dress to Impress')) {
      data = handleDTIImport(value);
    } else if (value.includes("This list was created at Jellyneo's Item Database!")) {
      data = handleJNImport(value);
    }

    setItemDataJson(JSON.stringify(data));
    setPPCode(value);
  };

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
        breadcrumb={
          <Breadcrumbs
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: t('Lists.Lists'),
                item: '/lists/official',
              },
              {
                position: 3,
                name: t('Lists.checklists-and-importing-items'),
                item: '/lists/import',
              },
              {
                position: 3,
                name: t('Lists.advanced-import'),
                item: '/lists/import/advanced',
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('Lists.import-from-pps')}
        </Heading>
        <Text as="div" sx={{ a: { color: '#b8e9a9' } }}>
          {t('Lists.import-advanced-description')}
        </Text>
      </HeaderCard>
      <Divider mb={3} />
      <Text fontSize={'md'} sx={{ b: { color: '#b8e9a9' } }}>
        {t.rich('Lists.import-adv-1', {
          b: (chunks) => <b>{chunks}</b>,
        })}
        <br />
        <Text as="span" fontSize={'sm'} color="gray.400">
          {t('Lists.import-adv-2')}
        </Text>
      </Text>
      <Center flexFlow="column" gap={3} sx={{ a: { color: '#b8e9a9' } }} mt={3}>
        <Flex
          flexFlow="column"
          bg="blackAlpha.400"
          borderRadius={'md'}
          p={3}
          w="100%"
          maxW={'900px'}
          justifyContent={'center'}
          alignItems={'center'}
          as={'form'}
          method="POST"
          target="_blank"
          action="/lists/import"
        >
          <input type="hidden" name="itemDataJson" value={itemDataJson} />
          <input type="hidden" name="indexType" value="name_image_id" />
          <Textarea
            placeholder={t('Lists.paste-pp-code')}
            size="md"
            variant={'filled'}
            onChange={(e) => handleChange(e.target.value)}
            value={ppCode}
            w="100%"
          />
          <Button colorScheme="green" mt={3} type="submit">
            {t('Lists.import-items')}
          </Button>
        </Flex>
      </Center>
    </>
  );
};

export default AdvancedImportPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../../translation/${context.locale}.json`)).default,
      locale: context.locale ?? 'en',
    },
  };
}

AdvancedImportPage.getLayout = function getLayout(
  page: ReactElement,
  props: AdvancedImportPageProps
) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('Lists.checklists-and-importing-items'),
        description: t('Lists.import-page-description'),
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/caption/sm_caption_831.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
      mainColor="#65855Bc7"
    >
      {page}
    </Layout>
  );
};

const handleJNImport = (ppCode: string) => {
  const $ = cheerio.load(ppCode);

  const items: any = {};

  $('td').each((i, el) => {
    const image = $(el).find('img').attr('src');
    const name = $(el).find('b').first().text();
    const image_id = image?.split('/')?.pop()?.split('.')[0];
    const quantityText = $(el).find('b').last().text();
    const qtd = quantityText !== name ? Number(quantityText.match(/\d+/g)) : 1;
    const x = [name, image_id];

    items[x.toString()] = qtd;
  });

  return items;
};

const handleDTIImport = (ppCode: string) => {
  const $ = cheerio.load(ppCode);

  const items: any = {};

  $('.dti-item').each((i, el) => {
    const image = $(el).find('img.dti-item-thumbnail').attr('src');
    const name = $(el).find('span').first().text();
    const image_id = image?.split('/')?.pop()?.split('.')[0];
    const x = [name, image_id];

    items[x.toString()] = 1;
  });

  return items;
};
