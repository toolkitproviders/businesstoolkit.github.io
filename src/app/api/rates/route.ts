import { NextRequest } from "next/server";
import { getRates, RateServiceError, RATES_TTL_SECONDS } from "@/lib/server/rates";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/rates?base=USD
 *
 * Proxies the configured exchange-rate provider so the API key (when one is
 * used) never reaches the browser, and so responses can be cached once for
 * every visitor rather than once per visitor.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "rates"), 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const base = (request.nextUrl.searchParams.get("base") ?? "USD").toUpperCase();

  if (!/^[A-Z]{3}$/.test(base)) {
    return Response.json(
      { error: "Base currency must be a three-letter code, for example USD." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const table = await getRates(base);
    return Response.json(table, {
      headers: {
        // Serve stale rates rather than an error while revalidating.
        "Cache-Control": `public, max-age=${RATES_TTL_SECONDS}, s-maxage=${RATES_TTL_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    // Never surface provider internals or stack traces to the client.
    const known = error instanceof RateServiceError;
    return Response.json(
      {
        error: known
          ? error.message
          : "Exchange rates are temporarily unavailable. Please try again shortly.",
      },
      { status: known ? error.status : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
