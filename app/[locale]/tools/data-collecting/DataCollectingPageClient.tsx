'use client';

import { Box, Button, Center, Field, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { useTranslations } from 'next-intl';
import ItemSelect from '@components/Input/ItemSelect';
import { ItemData } from '@types';
import { useState } from 'react';
import ItemCard from '@components/Items/ItemCard';
import axios from 'axios';

const DATA_COLLECTING_OPTIONS: {
  [id: string]: {
    name: string;
    id: string;
    multiple: boolean;
    description: string;
  };
} = {
  dailyQuests: {
    name: 'Daily Quests',
    id: 'dailyQuests',
    multiple: true,
    description: 'We are collecting data on the new Daily Rewards in the Quest Log.',
  },
  weeklyQuests: {
    name: 'Weekly Quests',
    id: 'weeklyQuests',
    multiple: true,
    description: 'We are collecting data on the new Weekly Rewards in the Quest Log.',
  },
  wheelOfCelebration: {
    name: 'Wheel of Celebration',
    id: 'wheelOfCelebration',
    multiple: true,
    description: 'We are collecting data on the new Wheel of Celebration prizes.',
  },
};

export function DataCollectingPageClient() {
  const t = useTranslations();
  const toast = useToast();
  const [itemList, setItemList] = useState<ItemData[]>([]);
  const [type, setType] = useState<string>('');

  const onChange = (item: ItemData) => {
    const items = [...itemList].filter((i) => i.internal_id !== item.internal_id);
    items.push(item);
    setItemList(items);
  };

  const submit = async () => {
    const obj = {
      type: type,
      itemList: itemList.map((item) => item.internal_id).join(','),
    };

    const resProm = axios.post('/api/v1/tools/data-collecting', obj);
    toast.promise(resProm, {
      success: {
        id: 'data-collecting-success',
        title: t('General.success'),
        description: t('General.thank-you'),
      },
      error: {
        id: 'data-collecting-error',
        title: t('General.something-went-wrong'),
        description: t('General.try-again-later'),
      },
      loading: { id: 'data-collecting-loading', title: t('General.sending-dots') },
    });

    await resProm;

    setItemList([]);
  };

  return (
    <Flex
      flexFlow={{ base: 'column-reverse', md: 'row' }}
      justifyContent={'space-between'}
      w={'100%'}
      gap={8}
    >
      <Flex flexFlow={'column'} w="100%" maxW={'500px'}>
        <Field.Root my={5}>
          <Field.Label>Type</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              bg="blackAlpha.300"
              onChange={(e) => setType(e.target.value)}
              value={type}
            >
              <option value="">Select Type</option>
              {Object.values(DATA_COLLECTING_OPTIONS).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.HelperText>
            We&apos;re only seeking data from these places right now. We can add more in the future!
          </Field.HelperText>
        </Field.Root>
        <Box my={5}>
          <Text mb={2}>Item</Text>
          <ItemSelect isDisabled={!type} onChange={onChange} />
        </Box>
        <Center mt={4} gap={3}>
          <Button
            disabled={!itemList.length}
            colorPalette="gray"
            variant="ghost"
            onClick={() => setItemList([])}
          >
            Clear
          </Button>
          <Button disabled={!itemList.length} colorPalette="green" variant="ghost" onClick={submit}>
            Submit
          </Button>
        </Center>
      </Flex>
      <Flex flexFlow="column" w={'100%'}>
        <Flex flexFlow="column" mb={3}>
          <Heading as="h3" size="md" textAlign={'center'}>
            {DATA_COLLECTING_OPTIONS[type]?.name}
          </Heading>
          <Text fontSize={'sm'} textAlign={'center'}>
            {DATA_COLLECTING_OPTIONS[type]?.description}
          </Text>
        </Flex>
        <Flex flex={1} borderRadius={'md'} bg="blackAlpha.500" p={3} gap={3}>
          {!!itemList.length && (
            <Flex gap={3} flexWrap={'wrap'} justifyContent={'center'}>
              {itemList.map((item) => (
                <ItemCard uniqueID={`data-collecting`} key={item.internal_id} item={item} small />
              ))}
            </Flex>
          )}
          {!itemList.length && (
            <Center flex="1">
              <Text color="gray.400">No items selected</Text>
            </Center>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
