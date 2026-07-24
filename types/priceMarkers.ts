/**
 * Presentation-ready price markers for the item price table/chart.
 * Resolution (dates, clamping, isPoint) happens in the server engine —
 * consumers only render these fields.
 */

type PriceMarkerBase = {
  id: string;
  /** Main label (official list name, or manual marker title). */
  title: string;
  /**
   * Badge copy, already presentation-ready.
   * Official lists omit this — `buildPriceTableData` fills translated
   * "Added to" / "Available at" / "Unavailable at" per table row.
   * Manual markers (PR4) set a custom string here.
   */
  badgeText?: string | null;
  /** Optional long text (markdown). Filled by manual markers (PR4); null for official lists today. */
  description?: string | null;
  /** Lightened hex, ready to paint. */
  color: string;
  /** Already clamped/validated for this item (>= firstSeen when applicable). */
  startAt: string;
  /** null = open-ended (e.g. "added to" without end). */
  endAt: string | null;
  /**
   * Render hint: true = single event (chart point; table usually one row via endAt).
   * false = range (chart segment; table start+end rows when endAt is set).
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
