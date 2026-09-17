import { NextRequest } from "next/server";
import { generateNames, type NameLength, type NameStyle } from "@/lib/server/name-generator";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const STYLES: NameStyle[] = ["modern", "abstract", "descriptive", "classic", "playful", "compound"];
const LENGTHS: NameLength[] = ["short", "medium", "long"];

/** Trims arbitrary client input down to something safe to pass onward. */
function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  // Generation is cheap and local, but the window still keeps one visitor from
  // monopolising the instance.
  const limit = rateLimit(clientKey(request, "names"), 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const industry = text(body.industry, 60);
  if (!industry) {
    return Response.json(
      { error: "Please choose an industry so the names can be relevant." },
      { status: 400 },
    );
  }

  const style = STYLES.includes(body.style as NameStyle) ? (body.style as NameStyle) : "modern";
  const length = LENGTHS.includes(body.length as NameLength)
    ? (body.length as NameLength)
    : "medium";

  const keywords = Array.isArray(body.keywords)
    ? body.keywords
        .map((k) => text(k, 24))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const count = Math.min(24, Math.max(6, Number(body.count) || 12));

  try {
    const result = await generateNames({
      industry,
      keywords,
      description: text(body.description, 300),
      style,
      audience: text(body.audience, 80),
      location: text(body.location, 60),
      length,
      count,
    });

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Never surface internals or stack traces.
    return Response.json(
      { error: "Name generation is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
