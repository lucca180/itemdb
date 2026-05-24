import {
  Button,
  Text,
  Flex,
  Input,
  IconButton,
  SimpleGrid,
  Textarea,
  Field,
  Box,
  Dialog,
  CloseButton,
  Portal,
  NativeSelect,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { BDData, BDIconTypes, ItemData } from '../../types';
import { useState } from 'react';
import { BiTrash } from 'react-icons/bi';
import type { BDDataEntry } from '../../pages/api/v1/bd';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), { ssr: false });

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export type EditBdInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bdData?: BDData;
  item: ItemData;
};

const icons = ['air', 'darkness', 'dark', 'physical', 'earth', 'fire', 'light', 'water', 'hp'];
const usesType = ['Once Per Battle', 'Multiple Use', 'Single Use'];
const fragility = ['Fragile', 'Semi-fragile'];

export default function EditBdInfoModal(props: EditBdInfoModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, item } = props;
  const [bdData, setBdData] = useState(props.bdData ?? {});
  const toast = useToast();

  const { data } = useSWR(`/api/v1/bd/process?item_iid=${item.internal_id}`, fetcher);

  const addNewEntry = (section: 'attack' | 'defense' | 'reflect') => {
    const updatedSection = [...(bdData[section] ?? []), { type: '', key: '', value: '' }];

    setBdData((prev) => ({
      ...prev,
      [section]: updatedSection,
    }));
  };

  const setIcon = (
    section: 'attack' | 'defense' | 'reflect',
    index: number,
    newValue: BDIconTypes
  ) => {
    const updatedSection = [...(bdData[section] ?? [])];
    updatedSection[index].type = newValue;

    const keyBase = `${section}_${newValue}`;
    let key = keyBase;
    let count = 1;

    const existingKeys = new Set(updatedSection.map((entry) => entry.key));

    while (existingKeys.has(key)) {
      count += 1;
      key = `${keyBase}_${count}`;
    }

    updatedSection[index].key = key;

    setBdData((prev) => ({
      ...prev,
      [section]: updatedSection,
    }));
  };

  const deleteIcon = (section: 'attack' | 'defense' | 'reflect', index: number) => {
    const updatedSection = [...(bdData[section] ?? [])];
    updatedSection.splice(index, 1);

    setBdData((prev) => ({
      ...prev,
      [section]: updatedSection,
    }));
  };

  const handleChange = (
    section: 'attack' | 'defense' | 'reflect',
    index: number,
    value: string
  ) => {
    const updatedSection = [...(bdData[section] ?? [])];
    updatedSection[index].value = value;
    setBdData((prev) => ({
      ...prev,
      [section]: updatedSection,
    }));
  };

  const handleOthers = (field: string, value: string) => {
    setBdData((prev) => ({
      ...prev,
      other: {
        ...prev.other,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const data = getEditData();

    const prom = axios.put('/api/v1/bd', {
      item_iid: item.internal_id,
      ...data,
    });

    toast.promise(prom, {
      success: { title: 'Success', description: 'Thank you' },
      error: { title: 'Something wrong', description: 'Please try again later' },
      loading: { title: 'Please wait' },
    });

    prom.then(() => onClose()).catch((e) => console.error(e));
  };

  const getEditData = () => {
    const data: BDDataEntry[] = [];
    const removeData: string[] = [];

    for (const section of Object.keys(bdData) as (keyof BDData)[]) {
      if (section === 'processing') continue;
      const original = props.bdData?.[section];
      const current = bdData[section];

      if (section === 'notes' && current !== original) {
        if (!current) {
          removeData.push('notes');
          continue;
        }

        data.push({ type: 'notes', key: 'notes', value: current as string });
        continue;
      }

      if (section === 'other') {
        data.push(
          ...diffOtherSection(
            original as Record<string, string>,
            current as Record<string, string>,
            section
          )
        );
        continue;
      }

      const { addedOrUpdated, removed } = diffArraySection(
        original as BDData['attack'],
        current as BDData['attack']
      );

      data.push(...addedOrUpdated);
      removeData.push(...removed);
    }

    return { addOrEdit: data, remove: removeData };
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="6xl" w="full">
            <Dialog.Header>
              <Dialog.Title>Edit BD Info</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize={'sm'} css={{ '& a': { color: 'blue.200' } }}>
              <SimpleGrid columns={3} gap={6}>
                {['attack', 'defense', 'reflect'].map((section) => (
                  <Flex flex="1" key={section} flexDirection={'column'} mb={4} gap={3}>
                    <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                      {section}
                    </Text>
                    {((bdData[section as keyof typeof bdData] as any[]) ?? []).map(
                      ({ type, value }, index) => (
                        <Flex gap={2} key={index}>
                          <NativeSelect.Root size="sm" variant="subtle" flex={1} disabled={!!type}>
                            <NativeSelect.Field
                              value={type}
                              onChange={(e) =>
                                setIcon(
                                  section as 'attack' | 'defense' | 'reflect',
                                  index,
                                  e.target.value as BDIconTypes
                                )
                              }
                            >
                              <option value="" disabled>
                                Select Type
                              </option>
                              {icons.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon.charAt(0).toUpperCase() + icon.slice(1)}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          <Input
                            onChange={(e) =>
                              handleChange(section as 'attack' | 'defense', index, e.target.value)
                            }
                            placeholder="Value"
                            size="sm"
                            variant={'subtle'}
                            value={value}
                            flex={1}
                          />
                          <IconButton
                            size="sm"
                            onClick={() => deleteIcon(section as 'attack' | 'defense', index)}
                            aria-label="delete icon"
                          >
                            <BiTrash />
                          </IconButton>
                        </Flex>
                      )
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addNewEntry(section as 'attack' | 'defense')}
                    >
                      Add new
                    </Button>
                  </Flex>
                ))}
                <Flex flexDirection={'column'} mb={4} gap={3}>
                  <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                    Other
                  </Text>
                  <SimpleGrid columns={2} gap={2}>
                    <Field.Root>
                      <Field.Label fontSize="xs">Use Type</Field.Label>
                      <NativeSelect.Root size="sm" variant="subtle">
                        <NativeSelect.Field
                          name="use"
                          value={bdData.other?.use ?? ''}
                          onChange={(e) => handleOthers('use', e.target.value)}
                        >
                          <option value="">Use Type</option>
                          {usesType.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="xs">Fragility</Field.Label>
                      <NativeSelect.Root size="sm" variant="subtle">
                        <NativeSelect.Field
                          name="fragility"
                          value={bdData.other?.fragility ?? ''}
                          onChange={(e) => handleOthers('fragility', e.target.value)}
                        >
                          <option value="">Fragility</option>
                          {fragility.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="xs">Freeze Chance</Field.Label>
                      <Input
                        placeholder="Freeze"
                        size="sm"
                        variant={'subtle'}
                        value={bdData.other?.freeze ?? ''}
                        onChange={(e) => handleOthers('freeze', e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="xs">Equip Limit</Field.Label>
                      <Input
                        placeholder="Limit"
                        size="sm"
                        variant={'subtle'}
                        value={bdData.other?.limit ?? ''}
                        onChange={(e) => handleOthers('limit', e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="xs">Heal</Field.Label>
                      <Input
                        placeholder="Heal"
                        size="sm"
                        variant={'subtle'}
                        value={bdData.other?.hp ?? ''}
                        onChange={(e) => handleOthers('hp', e.target.value)}
                      />
                    </Field.Root>
                  </SimpleGrid>
                </Flex>
                <Flex flexDirection={'column'} mb={4} gap={3}>
                  <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                    Notes
                  </Text>
                  <Textarea
                    placeholder="Notes"
                    value={bdData.notes ?? ''}
                    variant={'subtle'}
                    onChange={(e) => setBdData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </Flex>
                <Flex flexDirection={'column'} mb={4} gap={3}>
                  <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                    Processed Data
                  </Text>
                  <Box
                    overflow="auto"
                    maxHeight="300px"
                    borderRadius="md"
                    bg="blackAlpha.400"
                    p={2}
                  >
                    <ReactJsonView
                      theme={'google'}
                      src={data}
                      collapsed={3}
                      name={false}
                      displayDataTypes={false}
                      enableClipboard={false}
                      style={{ background: 'transparent' }}
                    />
                  </Box>
                </Flex>
              </SimpleGrid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose} size="sm">
                {t('General.close')}
              </Button>
              <Button variant="ghost" onClick={handleSave} size="sm">
                Save
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

const diffArraySection = (original: BDData['attack'] = [], current: BDData['attack'] = []) => {
  const addedOrUpdated: { type: string; key: string; value: string }[] = [];
  const removed: string[] = [];
  const originalMap = new Map(original.map((e) => [e.key, e.value]));
  const currentMap = new Map(current.map((e) => [e.key, e.value]));

  // add / update
  for (let i = 0; i < current.length; i++) {
    const { type, value, key } = current[i];
    if (!originalMap.has(key) || originalMap.get(key) !== value) {
      addedOrUpdated.push({ type, key, value: value.toString() });
    }
  }

  // remove
  for (let i = 0; i < original.length; i++) {
    const { key } = original[i];
    if (!currentMap.has(key)) {
      removed.push(key);
    }
  }

  return { addedOrUpdated, removed };
};

const diffOtherSection = (
  original: Record<string, string> = {},
  current: Record<string, string> = {},
  section: keyof BDData = 'other'
) => {
  const changes: { type: string; key: string; value: string }[] = [];

  for (const key in current) {
    if (current[key] !== original[key]) {
      changes.push({ type: key, key: `${section}_${key}`, value: current[key] });
    }
  }

  return changes;
};
