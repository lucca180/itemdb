import { describe, expect, test } from 'vitest';
import Color from 'color';
import { getLabCell, getLabCellsForBox, LAB_CELL_SIZE } from '@utils/item/labCell';

const TOLERANCE = 750; // default color search tolerance (squared LAB distance)
const RADIUS = Math.sqrt(TOLERANCE);

// Small deterministic PRNG (mulberry32) so failures are reproducible.
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const labOf = (hex: string) => Color(hex).lab().array() as [number, number, number];

describe('getLabCell', () => {
  test('encodes L, a + 128 and b + 128 cells', () => {
    // L 53 -> 2, a 80 -> (208 / 20) 10, b 67 -> (195 / 20) 9
    expect(getLabCell(53, 80, 67)).toBe(21009);
    // negative a/b: a -40 -> (88 / 20) 4, b -108 -> (20 / 20) 1
    expect(getLabCell(30, -40, -108)).toBe(10401);
  });

  test('cell boundaries belong to the upper cell', () => {
    expect(getLabCell(40, -128, -108)).toBe(20001);
    // just below the edges: L -> 1, a -> -1 (still consistent with the SQL FLOOR), b -> 1
    expect(getLabCell(39.999999, -128.000001, -108)).toBe(9901);
  });
});

describe('getLabCellsForBox', () => {
  test.each(['#ff0000', '#4b8b3b', '#7f7f7f', '#ffffff', '#000000', '#0000ff'])(
    '%s: 3 or 4 cells per axis with the default tolerance',
    (hex) => {
      const cells = getLabCellsForBox(...labOf(hex), RADIUS);
      const perAxis = Math.cbrt(cells.length);
      expect([27, 36, 48, 64]).toContain(cells.length);
      expect(perAxis).toBeGreaterThanOrEqual(3);
      expect(perAxis).toBeLessThanOrEqual(4);
      expect(new Set(cells).size).toBe(cells.length);
    }
  );

  test('never misses a color within the tolerance (property)', () => {
    const next = random(42);
    const targets = ['#ff0000', '#4b8b3b', '#7f7f7f', '#ffffff', '#000000', '#ffd700'];

    for (const hex of targets) {
      const [l, a, b] = labOf(hex);
      const cells = new Set(getLabCellsForBox(l, a, b, RADIUS));

      for (let i = 0; i < 5000; i++) {
        // Random point inside the sphere, biased towards its surface where misses would happen.
        const u = next() * 2 - 1;
        const theta = next() * 2 * Math.PI;
        const s = Math.sqrt(1 - u * u);
        const dist = RADIUS * Math.cbrt(0.5 + next() / 2);
        const point = [
          l + dist * s * Math.cos(theta),
          a + dist * s * Math.sin(theta),
          b + dist * u,
        ];

        expect(cells.has(getLabCell(point[0], point[1], point[2]))).toBe(true);
      }

      // Box corners and edge midpoints are the extreme cases of the enumeration.
      for (const dl of [-RADIUS, 0, RADIUS])
        for (const da of [-RADIUS, 0, RADIUS])
          for (const db of [-RADIUS, 0, RADIUS])
            expect(cells.has(getLabCell(l + dl, a + da, b + db))).toBe(true);
    }
  });

  test('covers only cells that touch the box', () => {
    const [l, a, b] = labOf('#ff0000');
    const cells = getLabCellsForBox(l, a, b, RADIUS);
    // Cell size bounds the overshoot: at most one extra cell per axis beyond the box span.
    expect(cells.length).toBeLessThanOrEqual(
      Math.pow(Math.ceil((2 * RADIUS) / LAB_CELL_SIZE) + 1, 3)
    );
  });
});
