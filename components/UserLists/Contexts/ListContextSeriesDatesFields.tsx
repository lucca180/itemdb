'use client';

import {
  Checkbox,
  Field,
  HStack,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ItemV2For, ListItemInfo } from '@types';
import {
  MAX_SERIES_DATE,
  MIN_SERIES_DATE,
  isSeriesDateInputValid,
  planSeriesDatesChange,
  seriesDay,
  type SeriesDatesChange,
  type SeriesDatesPlan,
  type SeriesDays,
} from '@utils/list/seriesDates';

/** `keep` is the default: saving a context doesn't touch its items' dates unless asked to. */
const DATES_MODES = ['keep', 'fill', 'overwrite', 'clear'] as const;

export type SeriesDatesForm = {
  mode: (typeof DATES_MODES)[number];
  seriesStart: string;
  seriesEnd: string;
  clearStart: boolean;
  clearEnd: boolean;
};

export const emptySeriesDatesForm = (): SeriesDatesForm => ({
  mode: 'keep',
  seriesStart: '',
  seriesEnd: '',
  clearStart: true,
  clearEnd: true,
});

/** `null` when the form doesn't change any date. */
function toSeriesDatesChange(form: SeriesDatesForm): SeriesDatesChange | null {
  const change: SeriesDatesChange = { overwrite: form.mode !== 'fill' };

  if (form.mode === 'clear') {
    if (form.clearStart) change.seriesStart = null;
    if (form.clearEnd) change.seriesEnd = null;
  } else if (form.mode !== 'keep') {
    if (form.seriesStart) change.seriesStart = form.seriesStart;
    if (form.seriesEnd) change.seriesEnd = form.seriesEnd;
  }

  return change.seriesStart === undefined && change.seriesEnd === undefined ? null : change;
}

export type SeriesDatesFormState = {
  change: SeriesDatesChange | null;
  plan: SeriesDatesPlan<ListItemInfo>;
  isValid: boolean;
};

/** What the form would do to `rows` (the list items selected for the context). */
export function resolveSeriesDatesForm(
  form: SeriesDatesForm,
  rows: ListItemInfo[]
): SeriesDatesFormState {
  const change = toSeriesDatesChange(form);
  const usesInputs = form.mode === 'fill' || form.mode === 'overwrite';
  const inputsValid =
    !usesInputs ||
    (isSeriesDateInputValid(form.seriesStart) && isSeriesDateInputValid(form.seriesEnd));

  const plan =
    change && inputsValid ? planSeriesDatesChange(rows, change) : { changed: [], invalid: [] };

  return { change, plan, isValid: inputsValid && !plan.invalid.length };
}

/** Start date most of the dated items already have (e.g. to date an item added later). */
function commonSeriesStart(rows: ListItemInfo[]): string {
  const starts = rows.map((row) => seriesDay(row.seriesStart)).filter((day) => day !== null);
  return starts.find((day) => starts.filter((d) => d === day).length > starts.length / 2) ?? '';
}

const MAX_SUMMARY_PERIODS = 4;

type ListContextSeriesDatesFieldsProps = {
  form: SeriesDatesForm;
  onChange: (form: SeriesDatesForm) => void;
  state: SeriesDatesFormState;
  rows: ListItemInfo[];
  items: Record<string, ItemV2For<'card'>>;
  /** Unsaved edits on the page hold their own dates, so they must be saved first. */
  hasUnsavedChanges: boolean;
};

/** Bulk change of the series dates of the context's items, applied when the context is saved. */
export function ListContextSeriesDatesFields({
  form,
  onChange,
  state,
  rows,
  items,
  hasUnsavedChanges,
}: ListContextSeriesDatesFieldsProps) {
  const t = useTranslations();
  const format = useFormatter();

  const formatDay = (day: string) =>
    format.dateTime(new Date(`${day}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' });

  const formatPeriod = ({ seriesStart, seriesEnd }: SeriesDays) => {
    const start = seriesDay(seriesStart);
    const end = seriesDay(seriesEnd);
    if (!start && !end) return t('Lists.contexts-dates-none');
    if (start === end) return formatDay(start!);
    return `${start ? formatDay(start) : '…'} – ${end ? formatDay(end) : '…'}`;
  };

  const periods = new Map<string, number>();
  for (const row of rows) {
    const label = formatPeriod(row);
    periods.set(label, (periods.get(label) ?? 0) + 1);
  }
  const summary = [...periods].sort((a, b) => b[1] - a[1]);

  // changed items that lose a date they already had
  const replaced = state.plan.changed.filter(
    ({ row, seriesStart, seriesEnd }) =>
      (row.seriesStart && seriesDay(row.seriesStart) !== seriesStart) ||
      (row.seriesEnd && seriesDay(row.seriesEnd) !== seriesEnd)
  ).length;

  const changeMode = (mode: SeriesDatesForm['mode']) =>
    onChange({
      ...form,
      mode,
      seriesStart:
        mode === 'fill' && !form.seriesStart ? commonSeriesStart(rows) : form.seriesStart,
    });

  const dateInput = (field: 'seriesStart' | 'seriesEnd', label: string) => (
    <Field.Root invalid={!isSeriesDateInputValid(form[field])}>
      <Field.Label fontSize="xs">{label}</Field.Label>
      <Input
        size="sm"
        variant="subtle"
        type="date"
        min={MIN_SERIES_DATE}
        max={MAX_SERIES_DATE}
        value={form[field]}
        onChange={(e) => onChange({ ...form, [field]: e.target.value })}
      />
    </Field.Root>
  );

  const clearCheckbox = (field: 'clearStart' | 'clearEnd', label: string) => (
    <Checkbox.Root
      size="sm"
      checked={form[field]}
      onCheckedChange={({ checked }) => onChange({ ...form, [field]: checked === true })}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );

  return (
    <Stack gap={3} borderTopWidth="1px" borderColor="whiteAlpha.200" pt={3}>
      <Field.Root disabled={hasUnsavedChanges}>
        <Field.Label>{t('Lists.contexts-dates')}</Field.Label>
        <NativeSelect.Root size="sm" variant="subtle" disabled={hasUnsavedChanges}>
          <NativeSelect.Field
            value={form.mode}
            onChange={(e) => changeMode(e.target.value as SeriesDatesForm['mode'])}
          >
            {DATES_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`Lists.contexts-dates-${mode}`)}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Field.HelperText fontSize="xs">
          {hasUnsavedChanges
            ? t('Lists.contexts-dates-unsaved')
            : t(`Lists.contexts-dates-${form.mode}-help`)}
        </Field.HelperText>
      </Field.Root>

      {!!summary.length && (
        <Text fontSize="xs" color="gray.400">
          {t('Lists.contexts-dates-current')}{' '}
          {summary
            .slice(0, MAX_SUMMARY_PERIODS)
            .map(([label, count]) => `${label} (${count})`)
            .join(' · ')}
          {summary.length > MAX_SUMMARY_PERIODS && ` · +${summary.length - MAX_SUMMARY_PERIODS}`}
        </Text>
      )}

      {(form.mode === 'fill' || form.mode === 'overwrite') && (
        <SimpleGrid minChildWidth="130px" gap={2}>
          {dateInput('seriesStart', t('Lists.contexts-dates-start'))}
          {dateInput('seriesEnd', t('Lists.contexts-dates-end'))}
        </SimpleGrid>
      )}
      {form.mode === 'clear' && (
        <HStack gap={4}>
          {clearCheckbox('clearStart', t('Lists.contexts-dates-start'))}
          {clearCheckbox('clearEnd', t('Lists.contexts-dates-end'))}
        </HStack>
      )}

      {form.mode !== 'keep' && (
        <Stack gap={1}>
          <Text fontSize="xs" fontWeight="bold">
            {t('Lists.contexts-dates-preview', { count: state.plan.changed.length })}
          </Text>
          {replaced > 0 && (
            <Text fontSize="xs" color="orange.300">
              {t('Lists.contexts-dates-replaced', { count: replaced })}
            </Text>
          )}
          {!!state.plan.invalid.length && (
            <Text fontSize="xs" color="red.300">
              {t('Lists.contexts-dates-end-before-start')}{' '}
              {state.plan.invalid
                .map((row) => items[row.item_iid]?.name ?? row.item_iid)
                .join(', ')}
            </Text>
          )}
          {!(isSeriesDateInputValid(form.seriesStart) && isSeriesDateInputValid(form.seriesEnd)) &&
            form.mode !== 'clear' && (
              <Text fontSize="xs" color="red.300">
                {t('Lists.series-dates-invalid')}
              </Text>
            )}
        </Stack>
      )}
    </Stack>
  );
}
