import { describe, expect, test } from 'vitest';
import { isChecklist } from '@utils/list/dynamicListLabels';
import { dynamicListCan, isDynamicActionDisabled, isFullSyncList } from '@utils/utils';
import type { DynamicListTypes } from '@types';

const cases: { type: DynamicListTypes | null; add: boolean; remove: boolean }[] = [
  { type: null, add: true, remove: true },
  { type: 'addOnly', add: true, remove: false },
  { type: 'removeOnly', add: false, remove: true },
  { type: 'fullSync', add: false, remove: false },
  { type: 'search', add: false, remove: false },
];

describe('dynamic list permissions', () => {
  test.each(cases)('$type', ({ type, add, remove }) => {
    expect(dynamicListCan({ dynamicType: type }, 'add')).toBe(add);
    expect(dynamicListCan({ dynamicType: type }, 'remove')).toBe(remove);
    expect(isDynamicActionDisabled('add', type)).toBe(!add);
    expect(isDynamicActionDisabled('remove', type)).toBe(!remove);
  });

  test('search lists behave like fullSync', () => {
    expect(isFullSyncList('search')).toBe(true);
    expect(isFullSyncList('fullSync')).toBe(true);
    expect(isFullSyncList('addOnly')).toBe(false);
    expect(isFullSyncList(null)).toBe(false);
  });
});

describe('checklist naming', () => {
  test('only non-official fullSync lists are checklists', () => {
    expect(isChecklist({ dynamicType: 'fullSync', official: false })).toBe(true);
    expect(isChecklist({ dynamicType: 'fullSync', official: true })).toBe(false);
    expect(isChecklist({ dynamicType: 'search', official: false })).toBe(false);
    expect(isChecklist({ dynamicType: 'addOnly', official: false })).toBe(false);
    expect(isChecklist({ dynamicType: null, official: false })).toBe(false);
  });
});
