'use client';

import { useState } from 'react';
import { Box, Collapsible, Fieldset, Flex, Icon, RadioCard, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { LuChevronDown, LuInfo } from 'react-icons/lu';
import { IMPORT_QUANTITY_MODES, type ImportQuantityMode } from '@utils/list/importQuantityMode';
import {
  IMPORTED_AMOUNT_COLOR,
  ImportQuantityMath,
  LIST_AMOUNT_COLOR,
} from '@app/[locale]/lists/import/v2/ImportQuantityMath';

const EXAMPLE_LIST_AMOUNT = 2;
const EXAMPLE_IMPORTED = 3;

export type ImportQuantityModePickerProps = {
  value: ImportQuantityMode;
  onChange: (mode: ImportQuantityMode) => void;
  /** Items already in the selected list; `null` while no list is selected. */
  inListCount: number | null;
};

/** Mode name + description on the left, example math on the right. */
function ModeSummary({ mode }: { mode: ImportQuantityMode }) {
  const t = useTranslations();

  return (
    <Flex align="center" gap={2} w="100%" textAlign="start">
      <Box flex="1" minW={0}>
        <Text fontSize="xs" fontWeight="semibold" color="whiteAlpha.900">
          {t(`Lists.importV2-qty-${mode}`)}
        </Text>
        <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="short">
          {t(`Lists.importV2-qty-${mode}-desc`)}
        </Text>
      </Box>
      <ImportQuantityMath
        mode={mode}
        listAmount={EXAMPLE_LIST_AMOUNT}
        imported={EXAMPLE_IMPORTED}
      />
    </Flex>
  );
}

/** Select-like trigger showing the current mode; expands into the full option list. */
export function ImportQuantityModePicker({
  value,
  onChange,
  inListCount,
}: ImportQuantityModePickerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Fieldset.Root gap={1.5} spaceY={0}>
      <Fieldset.Legend mb={1.5} fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
        {t('General.quantities')}
      </Fieldset.Legend>
      <Text fontSize="2xs" color="whiteAlpha.600" mb={1}>
        {t('Lists.importV2-qty-help')}
      </Text>

      <Collapsible.Root
        open={open}
        onOpenChange={({ open: next }) => setOpen(next)}
        w="100%"
        bg="blackAlpha.300"
        borderWidth="1px"
        borderColor={open ? 'teal.700' : 'whiteAlpha.200'}
        borderRadius="md"
        transition="border-color 0.15s"
      >
        <Collapsible.Trigger
          display="flex"
          alignItems="center"
          gap={2}
          w="100%"
          py={2}
          px={2.5}
          cursor="pointer"
          borderRadius="md"
          transition="background 0.15s"
          _hover={{ bg: 'whiteAlpha.100', '& [data-part="indicator"]': { color: 'teal.300' } }}
          onClick={() => window.umami?.track('import-v2-qty-toggle', { open: !open })}
        >
          <ModeSummary mode={value} />
          <Collapsible.Indicator
            transition="transform 0.15s, color 0.15s"
            _open={{ transform: 'rotate(180deg)', color: 'teal.300' }}
            color="whiteAlpha.600"
          >
            <LuChevronDown />
          </Collapsible.Indicator>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <RadioCard.Root
            size="sm"
            variant="surface"
            colorPalette="teal"
            orientation="vertical"
            gap={1.5}
            p={1.5}
            pt={0}
            value={value}
            onValueChange={({ value: next }) => {
              if (!next) return;
              window.umami?.track('import-v2-option', { label: 'quantityMode', value: next });
              onChange(next as ImportQuantityMode);
              setOpen(false);
            }}
          >
            {IMPORT_QUANTITY_MODES.map((mode) => (
              <RadioCard.Item key={mode} value={mode} w="100%">
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl
                  py={2}
                  px={2.5}
                  cursor="pointer"
                  transition="background 0.15s, border-color 0.15s"
                  _hover={{ bg: 'whiteAlpha.100', borderColor: 'teal.600' }}
                >
                  <ModeSummary mode={mode} />
                </RadioCard.ItemControl>
              </RadioCard.Item>
            ))}
          </RadioCard.Root>
        </Collapsible.Content>
      </Collapsible.Root>

      <Text fontSize="2xs" color="whiteAlpha.500" mt={1}>
        {t.rich('Lists.importV2-qty-example', {
          list: (chunk) => (
            <Text as="span" fontWeight="semibold" color={LIST_AMOUNT_COLOR}>
              {chunk}
            </Text>
          ),
          imported: (chunk) => (
            <Text as="span" fontWeight="semibold" color={IMPORTED_AMOUNT_COLOR}>
              {chunk}
            </Text>
          ),
        })}
      </Text>

      {inListCount !== null && (
        <Flex gap={1.5} align="flex-start" mt={1}>
          <Icon as={LuInfo} color="teal.300" boxSize={3} mt={0.5} flexShrink={0} />
          <Text fontSize="2xs" color="teal.200">
            {t('Lists.importV2-qty-in-list', { count: inListCount })}
          </Text>
        </Flex>
      )}
    </Fieldset.Root>
  );
}
