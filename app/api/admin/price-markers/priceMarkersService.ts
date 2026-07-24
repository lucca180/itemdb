import 'server-only';

import { revalidateTag } from 'next/cache';
import { isValid, isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import { UTCDate } from '@date-fns/utc';
import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import { itemRootTag, itemSectionTag } from '@utils/appCacheTags';
import {
  MARKER_COLOR_PATTERN,
  MAX_MARKER_BADGE_LENGTH,
  MAX_MARKER_ITEM_IDS,
  MAX_MARKER_TITLE_LENGTH,
  type ManualMarkerAdminDTO,
  type ManualMarkerCreateRequest,
  type ManualMarkerFields,
  type ManualMarkerUpdateRequest,
} from './priceMarkersShared';

export {
  MARKER_COLOR_PATTERN,
  MAX_MARKER_BADGE_LENGTH,
  MAX_MARKER_ITEM_IDS,
  MAX_MARKER_TITLE_LENGTH,
  type ManualMarkerAdminDTO,
  type ManualMarkerCreateRequest,
  type ManualMarkerUpdateRequest,
} from './priceMarkersShared';

export class ManualMarkerInputError extends Error {}

const markerInclude = {
  items: {
    select: {
      item: {
        select: { internal_id: true, name: true, image: true },
      },
    },
  },
} satisfies Prisma.ManualPriceMarkerInclude;

type ManualMarkerWithItems = Prisma.ManualPriceMarkerGetPayload<{ include: typeof markerInclude }>;

function serializeMarker(marker: ManualMarkerWithItems): ManualMarkerAdminDTO {
  return {
    internal_id: marker.internal_id,
    badgeText: marker.badgeText,
    title: marker.title,
    description: marker.description,
    color: marker.color,
    startAt: marker.startAt.toJSON(),
    endAt: marker.endAt?.toJSON() ?? null,
    isPoint: marker.isPoint,
    createdBy: marker.createdBy,
    createdAt: marker.createdAt.toJSON(),
    updatedAt: marker.updatedAt.toJSON(),
    items: marker.items
      .map((row) => ({
        internal_id: row.item.internal_id,
        name: row.item.name,
        image: row.item.image,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function listManualMarkers(): Promise<ManualMarkerAdminDTO[]> {
  const markers = await prisma.manualPriceMarker.findMany({
    include: markerInclude,
    orderBy: { createdAt: 'desc' },
  });

  return markers.map(serializeMarker);
}

export async function getManualMarkerById(id: number): Promise<ManualMarkerAdminDTO | null> {
  const marker = await prisma.manualPriceMarker.findUnique({
    where: { internal_id: id },
    include: markerInclude,
  });

  return marker ? serializeMarker(marker) : null;
}

export type ManualMarkerMutationResult = {
  marker: ManualMarkerAdminDTO;
  affectedItemIds: number[];
};

export async function createManualMarker(
  body: ManualMarkerCreateRequest,
  createdBy?: string
): Promise<ManualMarkerMutationResult> {
  const fields = normalizeMarkerFields(body, { partial: false });
  assertAtLeastOneLabel(fields.badgeText ?? null, fields.title ?? null, fields.description ?? null);
  const itemIds = await assertExistingItemIds(normalizeItemIds(body.itemIds));

  const created = await prisma.$transaction(async (tx) => {
    const marker = await tx.manualPriceMarker.create({
      data: {
        badgeText: fields.badgeText ?? null,
        title: fields.title ?? null,
        description: fields.description ?? null,
        color: fields.color!,
        startAt: new Date(fields.startAt!),
        endAt: fields.endAt ? new Date(fields.endAt) : null,
        isPoint: fields.isPoint ?? false,
        createdBy: createdBy ?? null,
      },
    });

    await tx.manualPriceMarkerItem.createMany({
      data: itemIds.map((item_iid) => ({ marker_id: marker.internal_id, item_iid })),
      skipDuplicates: true,
    });

    return tx.manualPriceMarker.findUniqueOrThrow({
      where: { internal_id: marker.internal_id },
      include: markerInclude,
    });
  });

  await revalidateMarkersForItems(itemIds);

  return { marker: serializeMarker(created), affectedItemIds: itemIds };
}

export async function updateManualMarker(
  id: number,
  body: ManualMarkerUpdateRequest
): Promise<ManualMarkerMutationResult> {
  const existing = await prisma.manualPriceMarker.findUnique({
    where: { internal_id: id },
    include: markerInclude,
  });
  if (!existing) throw new ManualMarkerInputError('Marker not found');

  const fields = normalizeMarkerFields(body, {
    partial: true,
    currentIsPoint: existing.isPoint,
    currentStartAt: existing.startAt,
    currentEndAt: existing.endAt,
  });
  assertAtLeastOneLabel(
    fields.badgeText !== undefined ? fields.badgeText : existing.badgeText,
    fields.title !== undefined ? fields.title : existing.title,
    fields.description !== undefined ? fields.description : existing.description
  );
  const hasItemIds = body.itemIds !== undefined;
  const nextItemIds = hasItemIds
    ? await assertExistingItemIds(normalizeItemIds(body.itemIds))
    : null;
  const prevItemIds = existing.items.map((row) => row.item.internal_id);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.manualPriceMarker.update({
      where: { internal_id: id },
      data: {
        ...(fields.badgeText !== undefined ? { badgeText: fields.badgeText } : {}),
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.description !== undefined ? { description: fields.description } : {}),
        ...(fields.color !== undefined ? { color: fields.color } : {}),
        ...(fields.startAt !== undefined ? { startAt: new Date(fields.startAt) } : {}),
        ...(fields.endAt !== undefined
          ? { endAt: fields.endAt ? new Date(fields.endAt) : null }
          : {}),
        ...(fields.isPoint !== undefined ? { isPoint: fields.isPoint } : {}),
      },
    });

    if (nextItemIds) {
      const toRemove = prevItemIds.filter((itemId) => !nextItemIds.includes(itemId));
      const toAdd = nextItemIds.filter((itemId) => !prevItemIds.includes(itemId));

      if (toRemove.length) {
        await tx.manualPriceMarkerItem.deleteMany({
          where: { marker_id: id, item_iid: { in: toRemove } },
        });
      }

      if (toAdd.length) {
        await tx.manualPriceMarkerItem.createMany({
          data: toAdd.map((item_iid) => ({ marker_id: id, item_iid })),
          skipDuplicates: true,
        });
      }
    }

    return tx.manualPriceMarker.findUniqueOrThrow({
      where: { internal_id: id },
      include: markerInclude,
    });
  });

  const affectedItemIds = [...new Set([...prevItemIds, ...(nextItemIds ?? prevItemIds)])];
  await revalidateMarkersForItems(affectedItemIds);

  return { marker: serializeMarker(updated), affectedItemIds };
}

export type ManualMarkerDeleteResult = {
  marker: ManualMarkerAdminDTO;
  affectedItemIds: number[];
};

export async function deleteManualMarker(id: number): Promise<ManualMarkerDeleteResult> {
  const existing = await prisma.manualPriceMarker.findUnique({
    where: { internal_id: id },
    include: markerInclude,
  });
  if (!existing) throw new ManualMarkerInputError('Marker not found');

  const snapshot = serializeMarker(existing);
  const affectedItemIds = snapshot.items.map((item) => item.internal_id);

  // Hard delete — cascade removes ManualPriceMarkerItem rows.
  await prisma.manualPriceMarker.delete({ where: { internal_id: id } });
  await revalidateMarkersForItems(affectedItemIds);

  return { marker: snapshot, affectedItemIds };
}

async function revalidateMarkersForItems(itemIds: number[]): Promise<void> {
  for (const itemId of itemIds) {
    revalidateTag(itemSectionTag(itemId, 'markers'), 'max');
    revalidateTag(itemRootTag(itemId), 'max');
  }
}

type NormalizeOptions = {
  partial: boolean;
  /** Stored `isPoint` — used on PATCH when the field is not being changed. */
  currentIsPoint?: boolean;
  currentStartAt?: Date | string | null;
  currentEndAt?: Date | string | null;
};

function normalizeMarkerFields(
  body: Partial<ManualMarkerFields>,
  { partial, currentIsPoint, currentStartAt, currentEndAt }: NormalizeOptions
): Partial<ManualMarkerFields> {
  const fields: Partial<ManualMarkerFields> = {};

  if (body.badgeText !== undefined || !partial) {
    fields.badgeText = normalizeBadgeText(body.badgeText);
  }

  if (body.title !== undefined || !partial) {
    fields.title = normalizeNullableText(body.title, 'title', MAX_MARKER_TITLE_LENGTH);
  }

  if (body.description !== undefined || !partial) {
    fields.description = normalizeNullableText(body.description, 'description');
  }

  if (body.color !== undefined || !partial) {
    fields.color = normalizeColor(body.color);
  }

  if (body.startAt !== undefined || !partial) {
    fields.startAt = normalizeDate(body.startAt, 'startAt');
  }

  if (body.endAt !== undefined) {
    fields.endAt = body.endAt === null ? null : normalizeDate(body.endAt, 'endAt');
  } else if (!partial) {
    fields.endAt = null;
  }

  if (body.isPoint !== undefined || !partial) {
    fields.isPoint = normalizeBoolean(body.isPoint);
  }

  const effectiveStart =
    fields.startAt !== undefined
      ? fields.startAt
      : currentStartAt
        ? new Date(currentStartAt).toJSON()
        : undefined;
  const effectiveEnd =
    fields.endAt !== undefined
      ? fields.endAt
      : currentEndAt
        ? new Date(currentEndAt).toJSON()
        : currentEndAt === null
          ? null
          : undefined;

  // Same-day LA ranges match official-list behavior: treat as a single point.
  if (
    effectiveStart &&
    effectiveEnd &&
    isSameDay(new Date(effectiveStart), new Date(effectiveEnd), {
      in: tz('America/Los_Angeles'),
    })
  ) {
    fields.isPoint = true;
    fields.endAt = null;
    return fields;
  }

  const effectiveIsPoint = fields.isPoint ?? currentIsPoint ?? false;
  if (effectiveIsPoint) {
    // Single point markers have no range — any submitted end date is dropped.
    fields.endAt = null;
    return fields;
  }

  if (effectiveStart && effectiveEnd && new Date(effectiveEnd) < new Date(effectiveStart)) {
    throw new ManualMarkerInputError('endAt must be after startAt');
  }

  return fields;
}

/** At least one of custom badge, title, or description must be set.
 * Auto badge (`badgeText === null`) alone is not enough — pair it with title/description. */
function assertAtLeastOneLabel(
  badgeText: string | null,
  title: string | null,
  description: string | null
) {
  if (!title && !description && !badgeText) {
    throw new ManualMarkerInputError(
      'At least one of badgeText, title, or description is required'
    );
  }
}

/**
 * Manual badgeText semantics:
 * - `null` → auto i18n presets (same as official lists)
 * - `""` → hide badge
 * - non-empty → custom copy
 */
function normalizeBadgeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new ManualMarkerInputError('Invalid badgeText');
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_MARKER_BADGE_LENGTH) {
    throw new ManualMarkerInputError(`badgeText exceeds ${MAX_MARKER_BADGE_LENGTH} characters`);
  }
  return trimmed;
}

function normalizeNullableText(value: unknown, field: string, maxLength?: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new ManualMarkerInputError(`Invalid ${field}`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new ManualMarkerInputError(`${field} exceeds ${maxLength} characters`);
  }
  return trimmed;
}

function normalizeColor(value: unknown): string {
  if (typeof value !== 'string' || !MARKER_COLOR_PATTERN.test(value.trim())) {
    throw new ManualMarkerInputError('Invalid color (expected hex like #aabbcc)');
  }
  return value.trim();
}

function normalizeDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value) throw new ManualMarkerInputError(`Invalid ${field}`);
  if (!isValid(new Date(value))) throw new ManualMarkerInputError(`Invalid ${field}`);
  // Same convention as list seriesStart/seriesEnd and bulk price context:
  // date-only inputs become 18:00 UTC so LA calendar days stay stable.
  return new UTCDate(new UTCDate(value).setHours(18)).toJSON();
}

function normalizeBoolean(value: unknown): boolean {
  return value === true;
}

export async function assertExistingItemIds(itemIds: number[]): Promise<number[]> {
  const rows = await prisma.items.findMany({
    where: { internal_id: { in: itemIds } },
    select: { internal_id: true },
  });
  if (rows.length === itemIds.length) return itemIds;

  const found = new Set(rows.map((row) => row.internal_id));
  const missing = itemIds.filter((id) => !found.has(id));
  throw new ManualMarkerInputError(`Unknown item IDs: ${missing.join(', ')}`);
}

export function normalizeItemIds(value: unknown): number[] {
  if (!Array.isArray(value)) throw new ManualMarkerInputError('Invalid itemIds');

  const itemIds = [
    ...new Set(value.map((raw) => Number(raw)).filter((id) => Number.isInteger(id) && id > 0)),
  ];

  if (!itemIds.length) throw new ManualMarkerInputError('No valid item IDs');
  if (itemIds.length > MAX_MARKER_ITEM_IDS) {
    throw new ManualMarkerInputError(`Too many item IDs (max ${MAX_MARKER_ITEM_IDS})`);
  }

  return itemIds;
}

export function normalizeMarkerId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ManualMarkerInputError('Invalid marker id');
  return id;
}
