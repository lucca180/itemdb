'use client';

import { Flex, Center, Textarea, Button } from '@chakra-ui/react';
import { useState } from 'react';
import * as cheerio from 'cheerio';

type AdvancedImportFormProps = {
  locale: string;
  pastePlaceholder: string;
  importButton: string;
};

export function AdvancedImportForm({
  locale,
  pastePlaceholder,
  importButton,
}: AdvancedImportFormProps) {
  const [ppCode, setPPCode] = useState<string>('');
  const [itemDataJson, setItemDataJson] = useState<string>('');

  const handleChange = (value: string) => {
    let data;
    if (value.includes('dti-item')) {
      data = handleDTIImport(value);
    } else if (value.includes("This list was created at Jellyneo's Item Database!")) {
      data = handleJNImport(value);
    }

    setItemDataJson(JSON.stringify(data));
    setPPCode(value);
  };

  return (
    <Center flexFlow="column" gap={3} css={{ '& a': { color: '#b8e9a9' } }} mt={3}>
      <Flex
        asChild
        flexFlow="column"
        bg="blackAlpha.400"
        borderRadius={'md'}
        p={3}
        w="100%"
        maxW={'900px'}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <form method="POST" target="_blank" action="/api/v1/lists/import-session">
          <input type="hidden" name="itemDataJson" value={itemDataJson} />
          <input type="hidden" name="indexType" value="name_image_id" />
          <input type="hidden" name="locale" value={locale} />
          <Textarea
            placeholder={pastePlaceholder}
            size="md"
            variant={'subtle'}
            onChange={(e) => handleChange(e.target.value)}
            value={ppCode}
            w="100%"
          />
          <Button colorPalette="green" mt={3} type="submit">
            {importButton}
          </Button>
        </form>
      </Flex>
    </Center>
  );
}

function handleJNImport(ppCode: string) {
  const $ = cheerio.load(ppCode);
  const items: Record<string, number> = {};

  $('td').each((_i, el) => {
    const image = $(el).find('img').attr('src');
    const name = $(el).find('b').first().text();
    const image_id = image?.split('/')?.pop()?.split('.')[0];
    const quantityText = $(el).find('b').last().text();
    const qtd = quantityText !== name ? Number(quantityText.match(/\d+/g)) : 1;
    const x = [name, image_id];

    items[x.toString()] = qtd;
  });

  return items;
}

function handleDTIImport(ppCode: string) {
  const $ = cheerio.load(ppCode);
  const items: Record<string, number> = {};

  $('.dti-item').each((_i, el) => {
    const image = $(el).find('img.dti-item-thumbnail').attr('src');
    const name = $(el).find('span').first().text();
    const image_id = image?.split('/')?.pop()?.split('.')[0];
    const x = [name, image_id];

    items[x.toString()] = 1;
  });

  return items;
}
