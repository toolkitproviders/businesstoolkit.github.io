import { NextRequest } from "next/server";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/domain?name=example.com
 *
 * Checks registration using two public sources:
 *   1. RDAP (the successor to WHOIS) — authoritative for most TLDs.
 *   2. DNS-over-HTTPS — a fallback signal when RDAP has no bootstrap entry.
 *
 * A "available" result is a strong signal, never a guarantee: registry data
 * lags, and some names are reserved or premium. The UI says so.
 */

type Status = "available" | "registered" | "unknown";

const VALID_DOMAIN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,24})+$/;

async function checkRdap(domain: string): Promise<Status> {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 300 },
    });
    if (response.status === 404) return "available";
    if (response.ok) return "registered";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function checkDns(domain: string): Promise<Status> {
  try {
    // NS records are the reliable signal: a registered domain has nameservers
    // even when it has no website.
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return "unknown";
    const payload = (await response.json()) as { Status?: number; Answer?: unknown[] };
    // NXDOMAIN
    if (payload.Status === 3) return "available";
    if (Array.isArray(payload.Answer) && payload.Answer.length > 0) return "registered";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "domain"), 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const raw = (request.nextUrl.searchParams.get("name") ?? "").toLowerCase().trim();
  const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!domain || domain.length > 253 || !VALID_DOMAIN.test(domain)) {
    return Response.json(
      { error: "Enter a valid domain name, for example example.com." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rdap = await checkRdap(domain);
  const status: Status = rdap === "unknown" ? await checkDns(domain) : rdap;

  return Response.json(
    {
      domain,
      status,
      source: rdap === "unknown" ? "dns" : "rdap",
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}
