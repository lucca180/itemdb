'use client';

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Heading,
  HStack,
  Icon,
  NativeSelect,
  Text,
  VStack,
  Separator,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuCheck, LuImport, LuSparkles } from 'react-icons/lu';
import ListSelect from '@components/UserLists/ListSelect';
import { CreateLinkedListButton } from '@components/DynamicLists/CreateLinkedList';
import MainLink from '@components/Utils/MainLink';
import { dynamicListCan } from '@utils/utils';
import type { UserList, UserListLite } from '@types';
import type { ImportAction, ImportIgnore } from '@app/[locale]/lists/import/importShared';

export type ImportControlsSidebarProps = {
  list: UserListLite | undefined;
  onListChange: (list: UserListLite) => void;
  recommended_list?: UserList | null;
  onLinkedList: (list: UserList) => void;
  action: ImportAction;
  onActionChange: (action: ImportAction) => void;
  ignore: ImportIgnore[];
  onToggleIgnore: (value: ImportIgnore) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  itemCount: number;
};

export function ImportControlsSidebar({
  list,
  onListChange,
  recommended_list,
  onLinkedList,
  action,
  onActionChange,
  ignore,
  onToggleIgnore,
  onSubmit,
  isSubmitting,
  canSubmit,
  itemCount,
}: ImportControlsSidebarProps) {
  const t = useTranslations();

  return (
    <Box
      w="100%"
      bg="gray.800"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      p={4}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      <HStack gap={2}>
        <Icon as={LuImport} color="teal.400" boxSize={4} />
        <Heading size="sm" color="whiteAlpha.900">
          {t('Lists.importV2-controls-title')}
        </Heading>
      </HStack>

      <Box bg="teal.950" borderWidth="1px" borderColor="teal.800" borderRadius="md" p={2.5}>
        <Flex gap={2} align="flex-start">
          <Icon as={LuSparkles} color="teal.300" boxSize={3.5} mt={0.5} flexShrink={0} />
          <Text fontSize="xs" color="teal.200" lineHeight="short">
            {t('Lists.importV2-price-check-hint')}
          </Text>
        </Flex>
      </Box>

      <Field.Root>
        <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
          {t('Lists.import-target-list')}
        </Field.Label>
        <Flex gap={2} flexFlow="column" alignItems="flex-start">
          <ListSelect
            defaultValue={list}
            onChange={onListChange}
            createNew
            recommended_id={recommended_list?.internal_id}
          />
          {recommended_list && (
            <>
              <Text fontSize="xs" color="gray.300">
                {t('General.or')}
              </Text>
              <CreateLinkedListButton list={recommended_list} isImport onCreate={onLinkedList} />
            </>
          )}
        </Flex>
      </Field.Root>

      <Field.Root>
        <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
          {t('General.action')}
        </Field.Label>
        <NativeSelect.Root size="sm" variant="subtle" w="100%">
          <NativeSelect.Field
            value={action}
            onChange={(e) => onActionChange(e.target.value as ImportAction)}
          >
            <option value="add" disabled={!dynamicListCan(list, 'add')}>
              {t('Lists.add-these-items')}
            </option>
            <option value="remove" disabled={!dynamicListCan(list, 'remove')}>
              {t('Lists.remove-these-items')}
            </option>
            <option value="hide">{t('Lists.mark-as-hidden')}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
          {t('General.ignore')}
        </Field.Label>
        <VStack align="flex-start" gap={1.5}>
          {(['np', 'nc', 'quantity'] as const).map((value) => (
            <Checkbox.Root
              key={value}
              size="sm"
              colorPalette="teal"
              checked={ignore.includes(value)}
              onCheckedChange={() => onToggleIgnore(value)}
            >
              <Checkbox.HiddenInput value={value} />
              <Checkbox.Control />
              <Checkbox.Label fontSize="xs" color="whiteAlpha.800">
                {value === 'np'
                  ? t('General.np-items')
                  : value === 'nc'
                    ? t('General.nc-items')
                    : t('General.quantities')}
              </Checkbox.Label>
            </Checkbox.Root>
          ))}
        </VStack>
      </Field.Root>

      <Separator borderColor="whiteAlpha.100" />

      <VStack gap={2} align="stretch">
        <Button
          size="md"
          colorPalette="teal"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
          w="100%"
        >
          <Icon as={LuCheck} mr={1} boxSize={4} />
          {t('General.submit')}
        </Button>
        <Text fontSize="2xs" color="whiteAlpha.500" textAlign="center">
          {list
            ? t('Lists.importV2-ready', { count: itemCount })
            : t('Lists.importV2-select-list-hint')}
        </Text>
      </VStack>

      <Box
        bg="blackAlpha.300"
        p={2.5}
        borderRadius="md"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <Text fontSize="2xs" color="whiteAlpha.600" textAlign="center">
          {t.rich('Lists.adv-import-cta', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <MainLink href="/lists/import/advanced" prefetch={false}>
                <Text as="span" color="teal.300" _hover={{ textDecoration: 'underline' }}>
                  {chunk}
                </Text>
              </MainLink>
            ),
          })}
        </Text>
      </Box>
    </Box>
  );
}
