import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Flex,
  useToast,
  Select,
  Input,
  IconButton,
  SimpleGrid,
  Textarea,
  FormControl,
  FormLabel,
  Box,
} from '@chakra-ui/react';
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

    let keyBase = `${section}_${newValue}`;
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit BD Info</ModalHeader>
        <ModalCloseButton />
        <ModalBody fontSize={'sm'} sx={{ a: { color: 'blue.200' } }}>
          <SimpleGrid columns={3} spacing={6}>
            {['attack', 'defense', 'reflect'].map((section) => (
              <Flex flex="1" key={section} flexDirection={'column'} mb={4} gap={3}>
                <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                  {section}
                </Text>
                {((bdData[section as keyof typeof bdData] as any[]) ?? []).map(
                  ({ type, value }, index) => (
                    <Flex gap={2} key={index}>
                      <Select
                        placeholder="Select Type"
                        size="sm"
                        variant={'filled'}
                        value={type}
                        disabled={!!type}
                        onChange={(e) =>
                          setIcon(
                            section as 'attack' | 'defense' | 'reflect',
                            index,
                            e.target.value as BDIconTypes
                          )
                        }
                      >
                        {icons.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon.charAt(0).toUpperCase() + icon.slice(1)}
                          </option>
                        ))}
                      </Select>
                      <Input
                        onChange={(e) =>
                          handleChange(section as 'attack' | 'defense', index, e.target.value)
                        }
                        placeholder="Value"
                        size="sm"
                        variant={'filled'}
                        value={value}
                      />
                      <IconButton
                        icon={<BiTrash />}
                        size="sm"
                        onClick={() => deleteIcon(section as 'attack' | 'defense', index)}
                        aria-label="delete icon"
                      />
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
                <FormControl>
                  <FormLabel fontSize="xs">Use Type</FormLabel>
                  <Select
                    placeholder="Use Type"
                    size="sm"
                    name="use"
                    variant={'filled'}
                    value={bdData.other?.use ?? ''}
                    onChange={(e) => handleOthers('use', e.target.value)}
                  >
                    {usesType.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Fragility</FormLabel>
                  <Select
                    placeholder="Fragility"
                    size="sm"
                    name="fragility"
                    variant={'filled'}
                    value={bdData.other?.fragility ?? ''}
                    onChange={(e) => handleOthers('fragility', e.target.value)}
                  >
                    {fragility.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Freeze Chance</FormLabel>
                  <Input
                    placeholder="Freeze"
                    size="sm"
                    variant={'filled'}
                    value={bdData.other?.freeze ?? ''}
                    onChange={(e) => handleOthers('freeze', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Equip Limit</FormLabel>
                  <Input
                    placeholder="Limit"
                    size="sm"
                    variant={'filled'}
                    value={bdData.other?.limit ?? ''}
                    onChange={(e) => handleOthers('limit', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Heal</FormLabel>
                  <Input
                    placeholder="Heal"
                    size="sm"
                    variant={'filled'}
                    value={bdData.other?.hp ?? ''}
                    onChange={(e) => handleOthers('hp', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
            </Flex>
            <Flex flexDirection={'column'} mb={4} gap={3}>
              <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                Notes
              </Text>
              <Textarea
                placeholder="Notes"
                value={bdData.notes ?? ''}
                variant={'filled'}
                onChange={(e) => setBdData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Flex>
            <Flex flexDirection={'column'} mb={4} gap={3}>
              <Text fontWeight={'bold'} mb={2} textTransform={'capitalize'}>
                Processed Data
              </Text>
              <Box overflow="auto" maxHeight="300px" borderRadius="md" bg="blackAlpha.400" p={2}>
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
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} size="sm">
            {t('General.close')}
          </Button>
          <Button variant="ghost" onClick={handleSave} size="sm">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
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
