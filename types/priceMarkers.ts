/**
 * Presentation-ready price markers for the item price table/chart.
 * Resolution (dates, clamping, isPoint) happens in the server engine —
 * consumers only render these fields.
 */

type PriceMarkerBase = {
  id: string;
  /**
   * Main label (official list name, or manual marker title).
   * Manual markers may omit title when badgeText and/or description are set.
   * Supports markdown (rendered in the price table; stripped for chart tooltips).
   */
  title: string | null;
  /**
   * Badge copy, already presentation-ready when set.
   * - Official lists omit this — table fills translated Added to / Available at / Unavailable at.
   * - Manual: `null` = same auto i18n as official; `""` = hide badge; non-empty = custom copy.
   */
  badgeText?: string | null;
  /** Optional long text (markdown). Manual markers may use this alone; null for official lists today. */
  description?: string | null;
  /** Lightened hex, ready to paint. */
  color: string;
  /** Already clamped/validated for this item (>= firstSeen when applicable). */
  startAt: string;
  /** null = open-ended (e.g. "added to" without end). */
  endAt: string | null;
  /**
   * Render hint: true = single event (chart point).
   * false = range (chart segment; table start+end rows, or one range row when those edges are adjacent).
   */
  isPoint: boolean;
};

/** Marker derived from an official list series — always has a list slug for linking. */
export type OfficialListPriceMarker = PriceMarkerBase & {
  type: 'officialList';
  slug: string;
};

/** Manual marker (PR4) — no list link. */
export type ManualPriceMarkerDTO = PriceMarkerBase & {
  type: 'manual';
};

export type PriceMarker = OfficialListPriceMarker | ManualPriceMarkerDTO;
