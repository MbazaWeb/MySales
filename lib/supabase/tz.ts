/**
 * Business timezone helpers.
 *
 * The platform's business timezone is Africa/Dar_es_Salaam (EAT, UTC+3 —
 * no daylight saving). Server components run in UTC by default, so any
 * "today" or day-range logic must be pinned to EAT explicitly, otherwise
 * reports silently shift sales between days between 21:00–23:59 UTC.
 */

export const BIZ_TZ = "Africa/Dar_es_Salaam";
export const BIZ_TZ_OFFSET = "+03:00";

/** Current calendar date in the business timezone as `YYYY-MM-DD`. */
export function todayInBizTz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BIZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Calendar date of an ISO timestamp in the business timezone as `YYYY-MM-DD`. */
export function dateKeyInBizTz(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BIZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Inclusive day-range bounds (ISO timestamps with explicit EAT offset)
 * for a `YYYY-MM-DD` → `YYYY-MM-DD` span, safe to compare against
 * `timestamptz` columns via PostgREST.
 */
export function bizDayRange(from: string, to: string): { gte: string; lte: string } {
  return {
    gte: `${from}T00:00:00${BIZ_TZ_OFFSET}`,
    lte: `${to}T23:59:59.999${BIZ_TZ_OFFSET}`,
  };
}
