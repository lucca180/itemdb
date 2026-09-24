import { Prisma } from '@prisma/generated/client';

// LAB grid used to index ItemColor for search-by-color. LAB space is split into cubes of
// LAB_CELL_SIZE units and each color stores the id of the cube it falls in (`lab_cell`), so a
// search reads only the cubes around the target color instead of the whole table:
//
//   lab_cell = FLOOR(L / 20) * 10000 + FLOOR((a + 128) / 20) * 100 + FLOOR((b + 128) / 20)
//
// The TS and SQL versions below must stay identical — `scripts/backfill-lab-cell.ts --verify`
// compares stored values against the SQL one. Changing the cell size requires re-running the
// backfill with --force.

export const LAB_CELL_SIZE = 20;
// a/b go roughly from -128 to 127; the offset keeps cell coordinates non-negative.
export const LAB_AB_OFFSET = 128;

// Guards against float rounding differences between JS and MariaDB for colors sitting exactly
// on the edge of the search box.
const RADIUS_EPSILON = 1e-6;

const encode = (cellL: number, cellA: number, cellB: number) => cellL * 10000 + cellA * 100 + cellB;

export function getLabCell(l: number, a: number, b: number): number {
  return encode(
    Math.floor(l / LAB_CELL_SIZE),
    Math.floor((a + LAB_AB_OFFSET) / LAB_CELL_SIZE),
    Math.floor((b + LAB_AB_OFFSET) / LAB_CELL_SIZE)
  );
}

/**
 * Cells overlapping the cube [l ± radius] × [a ± radius] × [b ± radius]. Every color within
 * `radius` of (l, a, b) is inside that cube, so it is always in one of these cells.
 */
export function getLabCellsForBox(l: number, a: number, b: number, radius: number): number[] {
  const r = radius + RADIUS_EPSILON;
  const span = (value: number, offset: number) => {
    const cells: number[] = [];
    const first = Math.floor((value - r + offset) / LAB_CELL_SIZE);
    const last = Math.floor((value + r + offset) / LAB_CELL_SIZE);
    for (let cell = first; cell <= last; cell++) cells.push(cell);
    return cells;
  };

  const result: number[] = [];
  for (const cellL of span(l, 0))
    for (const cellA of span(a, LAB_AB_OFFSET))
      for (const cellB of span(b, LAB_AB_OFFSET)) result.push(encode(cellL, cellA, cellB));

  return result;
}

/** SQL version of getLabCell over an ItemColor row (optionally table-aliased). */
export function labCellSql(alias?: string): Prisma.Sql {
  const p = Prisma.raw(alias ? `${alias}.` : '');
  return Prisma.sql`(FLOOR(${p}lab_l / ${LAB_CELL_SIZE}) * 10000 + FLOOR((${p}lab_a + ${LAB_AB_OFFSET}) / ${LAB_CELL_SIZE}) * 100 + FLOOR((${p}lab_b + ${LAB_AB_OFFSET}) / ${LAB_CELL_SIZE}))`;
}
