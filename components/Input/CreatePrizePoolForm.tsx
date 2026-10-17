import { useState } from 'react';
import { Button, Checkbox, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { PrizePoolBadges } from '@components/Items/PrizePoolBadges';
import {
  composePoolName,
  decomposePoolName,
  emptyPoolNameOptions,
  getPoolNameWarnings,
  validatePoolNameOptions,
  type PoolNameOptions,
} from '@utils/item/prizePoolName';

type Preset = 'normal' | 'le' | 'bonus' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'le', label: 'LE' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'custom', label: 'Custom' },
];

type FlagKey = 'isLE' | 'isChance' | 'isOld' | 'isGram';

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: 'isLE', label: 'LE' },
  { key: 'isChance', label: 'Chance' },
  { key: 'isOld', label: 'Old' },
  { key: 'isGram', label: 'Gram' },
];

/** Keeps the name and drop range; resets the flags to the preset's. */
const presetOptions = (preset: Preset, prev: PoolNameOptions): PoolNameOptions => {
  const kept = { base: prev.base, minDrop: prev.minDrop, maxDrop: prev.maxDrop };

  if (preset === 'bonus') return { ...emptyPoolNameOptions, isBonus: true };
  if (preset === 'le') return { ...emptyPoolNameOptions, ...kept, isLE: true, isChance: true };
  if (preset === 'custom') return { ...prev, isBonus: false };
  return { ...emptyPoolNameOptions, ...kept };
};

const detectPreset = (options: PoolNameOptions): Preset => {
  if (options.isBonus) return 'bonus';
  if (!options.isOld && !options.isGram) {
    if (options.isLE && options.isChance) return 'le';
    if (!options.isLE && !options.isChance) return 'normal';
  }
  return 'custom';
};

const toDropValue = (value: string) =>
  value === '' ? null : Math.max(0, Math.round(Number(value)) || 0);

type CreatePrizePoolFormProps = {
  onSubmit: (poolName: string) => void;
  submitLabel?: string;
  /** Prefills the form (e.g. when renaming a pool). */
  initialName?: string;
  onCancel?: () => void;
};

/** Builds a prize pool name from a preset + fields, following the rules in prizePoolName. */
export const CreatePrizePoolForm = (props: CreatePrizePoolFormProps) => {
  const { onSubmit, submitLabel = 'Create New Pool', initialName, onCancel } = props;
  const [options, setOptions] = useState<PoolNameOptions>(() =>
    initialName ? decomposePoolName(initialName) : emptyPoolNameOptions
  );
  const [preset, setPreset] = useState<Preset>(() => detectPreset(options));
  const [error, setError] = useState<string | null>(null);

  const poolName = composePoolName(options);
  const warnings = getPoolNameWarnings(options);

  const selectPreset = (value: Preset) => {
    setPreset(value);
    setOptions((prev) => presetOptions(value, prev));
    setError(null);
  };

  const updateOptions = (changes: Partial<PoolNameOptions>) => {
    setOptions((prev) => ({ ...prev, ...changes }));
    setError(null);
  };

  const submit = () => {
    const validationError = validatePoolNameOptions(options);
    setError(validationError);
    if (validationError) return;

    onSubmit(poolName);
    if (!initialName) {
      setOptions((prev) => presetOptions(preset, { ...prev, base: '' }));
    }
  };

  return (
    <VStack align="stretch" gap={3}>
      <HStack gap={0} borderRadius="md" overflow="hidden" alignSelf="flex-start">
        {PRESETS.map(({ value, label }) => (
          <Button
            key={value}
            size="xs"
            borderRadius={0}
            variant={preset === value ? 'solid' : 'subtle'}
            onClick={() => selectPreset(value)}
          >
            {label}
          </Button>
        ))}
      </HStack>
      {preset !== 'bonus' && (
        <HStack>
          <Input
            size="sm"
            variant="subtle"
            placeholder={preset === 'le' ? 'Pool Name (optional)' : 'Pool Name'}
            value={options.base}
            onChange={(e) => updateOptions({ base: e.target.value })}
          />
          <HStack gap={1}>
            <Input
              size="xs"
              w="52px"
              type="number"
              min={0}
              placeholder="min"
              value={options.minDrop ?? ''}
              onChange={(e) => updateOptions({ minDrop: toDropValue(e.target.value) })}
            />
            <Text fontSize="xs">-</Text>
            <Input
              size="xs"
              w="52px"
              type="number"
              min={0}
              placeholder="max"
              value={options.maxDrop ?? ''}
              onChange={(e) => updateOptions({ maxDrop: toDropValue(e.target.value) })}
            />
          </HStack>
        </HStack>
      )}
      {preset === 'custom' && (
        <HStack flexWrap="wrap" gap={3}>
          {FLAGS.map(({ key, label }) => (
            <Checkbox.Root
              key={key}
              size="sm"
              checked={options[key]}
              onCheckedChange={(e) => updateOptions({ [key]: !!e.checked })}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{label}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </HStack>
      )}
      <VStack align="stretch" gap={1}>
        <HStack gap={1} flexWrap="wrap">
          <Text fontSize="xs" color="gray.400">
            Name:
          </Text>
          <Text fontSize="xs" fontFamily="mono">
            {poolName || '—'}
          </Text>
          {poolName && <PrizePoolBadges name={poolName} />}
        </HStack>
        {warnings.map((warning) => (
          <Text key={warning} fontSize="xs" color="orange.300">
            {warning}
          </Text>
        ))}
        {error && (
          <Text fontSize="xs" color="red.300">
            {error}
          </Text>
        )}
      </VStack>
      <HStack>
        <Button size="sm" flex={1} onClick={submit}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </HStack>
    </VStack>
  );
};
