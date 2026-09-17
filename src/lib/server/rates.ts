import "server-only";

/**
 * Exchange-rate service layer.
 *
 * The provider is isolated here so the Currency Converter never knows which
 * API is in use. Credentials come from environment variables and stay on the
 * server — the browser only ever sees our own `/api/rates` response.
 *
 * Default provider: open.er-api.com, which is free and needs no key. Set
 * EXCHANGE_RATE_API_URL (and optionally EXCHANGE_RATE_API_KEY) to switch.
 */

export interface RateTable {
  base: string;
  /** Units of each currency per 1 unit of `base`. */
  rates: Record<string, number>;
  /** ISO timestamp for when the provider last updated these rates. */
  updatedAt: string;
  provider: string;
}

export class RateServiceError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "RateServiceError";
  }
}

const DEFAULT_ENDPOINT = "https://open.er-api.com/v6/latest";

/** Rates are refreshed at most once an hour; the feed itself updates daily. */
export const RATES_TTL_SECONDS = 3600;

const SUPPORTED_BASE = /^[A-Z]{3}$/;

function buildUrl(base: string): string {
  const custom = process.env.EXCHANGE_RATE_API_URL?.trim();
  const key = process.env.EXCHANGE_RATE_API_KEY?.trim();

  if (custom) {
    const url = new URL(custom.replace(/\/$/, "") + `/${base}`);
    if (key) url.searchParams.set("access_key", key);
    return url.toString();
  }
  return `${DEFAULT_ENDPOINT}/${base}`;
}

interface OpenErApiResponse {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
  "error-type"?: string;
}

/**
 * Fetches a rate table. Next's fetch cache handles deduplication and the TTL,
 * so a burst of visitors results in one upstream request per hour per base.
 */
export async function getRates(baseInput: string): Promise<RateTable> {
  const base = baseInput.toUpperCase();
  if (!SUPPORTED_BASE.test(base)) {
    throw new RateServiceError("Base currency must be a three-letter code.", 400);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(base), {
      next: { revalidate: RATES_TTL_SECONDS, tags: ["exchange-rates"] },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new RateServiceError("The exchange rate service did not respond in time.");
  }

  if (!response.ok) {
    throw new RateServiceError("The exchange rate service is unavailable right now.");
  }

  let payload: OpenErApiResponse;
  try {
    payload = (await response.json()) as OpenErApiResponse;
  } catch {
    throw new RateServiceError("The exchange rate service returned an unreadable response.");
  }

  if (payload.result === "error" || !payload.rates || typeof payload.rates !== "object") {
    const reason = payload["error-type"];
    throw new RateServiceError(
      reason === "unsupported-code"
        ? "That currency is not supported by the rate provider."
        : "The exchange rate service returned no rates.",
      reason === "unsupported-code" ? 400 : 502,
    );
  }

  // Keep only clean numeric entries so a malformed field can't reach the client.
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(payload.rates)) {
    if (SUPPORTED_BASE.test(code) && typeof value === "number" && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }

  if (Object.keys(rates).length === 0) {
    throw new RateServiceError("The exchange rate service returned no usable rates.");
  }

  return {
    base: payload.base_code?.toUpperCase() ?? base,
    rates,
    updatedAt: payload.time_last_update_utc
      ? new Date(payload.time_last_update_utc).toISOString()
      : new Date().toISOString(),
    provider: process.env.EXCHANGE_RATE_API_URL ? "configured" : "open.er-api.com",
  };
}
