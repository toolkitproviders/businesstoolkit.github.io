"use client";

import * as React from "react";
import { Check, Globe, Heart, Loader2, Sparkles, X } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Input,
  Select,
  Spinner,
  Tabs,
  Textarea,
} from "@/components/ui";
import { CopyButton, ToolPanel } from "@/components/tools/shared";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Style = "modern" | "abstract" | "descriptive" | "classic" | "playful" | "compound";
type Length = "short" | "medium" | "long";
type DomainStatus = "idle" | "checking" | "available" | "registered" | "unknown" | "error";

interface Suggestion {
  name: string;
  rationale: string;
}

const INDUSTRIES = [
  "Technology / Software", "Retail / E-commerce", "Food & Beverage", "Health & Wellness",
  "Finance & Accounting", "Creative / Marketing Agency", "Property & Construction",
  "Education & Training", "Professional Services", "Logistics & Transport",
  "Beauty & Personal Care", "Travel & Hospitality", "Manufacturing", "Nonprofit", "Other",
];

const STYLES: { value: Style; label: string; hint: string }[] = [
  { value: "modern", label: "Modern", hint: "Short, clean, domain-friendly" },
  { value: "abstract", label: "Abstract", hint: "Invented words, easy to trademark" },
  { value: "descriptive", label: "Descriptive", hint: "Says what you do" },
  { value: "classic", label: "Classic", hint: "Established and traditional" },
  { value: "playful", label: "Playful", hint: "Warm and memorable" },
  { value: "compound", label: "Compound", hint: "Two words fused into one" },
];

export function BusinessNameGenerator({ toolSlug }: { toolSlug: string }) {
  const [industry, setIndustry] = React.useState(INDUSTRIES[0]);
  const [keywords, setKeywords] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [style, setStyle] = React.useState<Style>("modern");
  const [audience, setAudience] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [length, setLength] = React.useState<Length>("medium");

  const [names, setNames] = React.useState<Suggestion[]>([]);
  const [favourites, setFavourites] = React.useState<string[]>([]);
  const [tab, setTab] = React.useState<"results" | "favourites">("results");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [domains, setDomains] = React.useState<Record<string, DomainStatus>>({});

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const generate = async (append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/business-names", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          industry,
          keywords: keywords.split(/[,\s]+/).filter(Boolean).slice(0, 6),
          description,
          style,
          audience,
          location,
          length,
          count: 12,
        }),
      });

      const payload = (await response.json()) as
        | { names: Suggestion[] }
        | { error: string };

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? payload.error
            : "Name generation is temporarily unavailable. Please try again shortly.",
        );
        return;
      }

      setNames((prev) => {
        if (!append) return payload.names;
        const seen = new Set(prev.map((n) => n.name.toLowerCase()));
        return [...prev, ...payload.names.filter((n) => !seen.has(n.name.toLowerCase()))];
      });
      setTab("results");
      track("tool_completed", { tool: toolSlug, count: payload.names.length });
    } catch {
      setError("Could not reach the name service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = (name: string) =>
    setFavourites((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const domainFor = (name: string) =>
    `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

  const checkDomain = async (name: string) => {
    const domain = domainFor(name);
    if (!domain || domain === ".com") return;
    setDomains((prev) => ({ ...prev, [name]: "checking" }));
    try {
      const response = await fetch(`/api/domain?name=${encodeURIComponent(domain)}`);
      const payload = (await response.json()) as
        | { status: DomainStatus }
        | { error: string };
      setDomains((prev) => ({
        ...prev,
        [name]: "error" in payload ? "error" : payload.status,
      }));
    } catch {
      setDomains((prev) => ({ ...prev, [name]: "error" }));
    }
  };

  const checkAllDomains = async () => {
    // Sequential on purpose — parallel bursts trip the rate limiter.
    for (const suggestion of names.slice(0, 12)) {
      if (!domains[suggestion.name]) {
        await checkDomain(suggestion.name);
      }
    }
  };

  const shown = tab === "favourites"
    ? names.filter((n) => favourites.includes(n.name))
    : names;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <ToolPanel title="About your business" description="The more you describe, the better the names.">
          <Field label="Industry" htmlFor="bn-industry" required>
            <Select id="bn-industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="What does the business do?"
            htmlFor="bn-desc"
            hint="One or two sentences is plenty."
          >
            <Textarea
              id="bn-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A subscription coffee roastery delivering single-origin beans to home brewers."
              maxLength={300}
            />
          </Field>

          <Field
            label="Keywords"
            htmlFor="bn-keywords"
            hint="Comma-separated, up to six. Words you would like reflected in the name."
          >
            <Input
              id="bn-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="coffee, roast, craft"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--fg)]">Naming style</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  aria-pressed={style === s.value}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition-colors",
                    style === s.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg-subtle)]",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      style === s.value ? "text-[var(--accent)]" : "text-[var(--fg)]",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="block text-xs text-[var(--fg-muted)]">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target audience" htmlFor="bn-audience">
              <Input
                id="bn-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Home brewers, 25–45"
              />
            </Field>
            <Field label="Location / market" htmlFor="bn-location">
              <Input
                id="bn-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="United Kingdom"
              />
            </Field>
          </div>

          <Field label="Name length" htmlFor="bn-length">
            <Select
              id="bn-length"
              value={length}
              onChange={(e) => setLength(e.target.value as Length)}
            >
              <option value="short">Short — 5 to 9 characters</option>
              <option value="medium">Medium — 8 to 14 characters</option>
              <option value="long">Long — 14 to 22 characters</option>
            </Select>
          </Field>

          <Button onClick={() => generate(false)} disabled={loading} className="w-full">
            {loading ? <Spinner /> : <Sparkles />}
            {loading ? "Generating…" : "Generate names"}
          </Button>

          {error && <Alert tone="error">{error}</Alert>}
        </ToolPanel>
      </div>

      <div className="space-y-4">
        <ToolPanel
          title="Suggestions"
          description={
            names.length > 0
              ? "Names are combined from curated word lists, matched to your industry."
              : undefined
          }
          footer={
            names.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => generate(true)} disabled={loading}>
                  <Sparkles className="size-3.5" />
                  Generate more
                </Button>
                <Button variant="ghost" size="sm" onClick={checkAllDomains}>
                  <Globe className="size-3.5" />
                  Check all domains
                </Button>
                <CopyButton
                  value={names.map((n) => n.name).join("\n")}
                  label="Copy all"
                  variant="ghost"
                  size="sm"
                />
              </div>
            ) : undefined
          }
        >
          {names.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-strong)] px-6 py-16 text-center">
              <Sparkles className="mx-auto size-8 text-[var(--fg-subtle)]" aria-hidden="true" />
              <p className="mt-3 font-medium">No names yet</p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                Describe your business on the left and press Generate names.
              </p>
            </div>
          ) : (
            <>
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "results", label: "All", count: names.length },
                  { value: "favourites", label: "Favourites", count: favourites.length },
                ]}
              />

              {shown.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--fg-muted)]">
                  No favourites yet — tap the heart on a name you like.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {shown.map((suggestion) => {
                    const status = domains[suggestion.name] ?? "idle";
                    const isFavourite = favourites.includes(suggestion.name);
                    return (
                      <li
                        key={suggestion.name}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--fg)]">
                              {suggestion.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                              {suggestion.rationale}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavourite(suggestion.name)}
                            aria-pressed={isFavourite}
                            aria-label={
                              isFavourite
                                ? `Remove ${suggestion.name} from favourites`
                                : `Add ${suggestion.name} to favourites`
                            }
                            className={cn(
                              "shrink-0 rounded-md p-1.5 transition-colors",
                              isFavourite
                                ? "text-[var(--error)]"
                                : "text-[var(--fg-subtle)] hover:text-[var(--fg)]",
                            )}
                          >
                            <Heart
                              className="size-4"
                              fill={isFavourite ? "currentColor" : "none"}
                            />
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--border)] pt-2.5">
                          <DomainBadge
                            status={status}
                            domain={domainFor(suggestion.name)}
                            onCheck={() => checkDomain(suggestion.name)}
                          />
                          <CopyButton
                            value={suggestion.name}
                            label=""
                            size="icon"
                            variant="ghost"
                            className="ml-auto size-7"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Alert tone="warning" title="Check before you commit">
                A generated name may already be trademarked, registered or in use. Search your
                national company register and trademark database, and take legal advice, before
                adopting one.
              </Alert>
            </>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}

function DomainBadge({
  status,
  domain,
  onCheck,
}: {
  status: DomainStatus;
  domain: string;
  onCheck: () => void;
}) {
  if (status === "idle") {
    return (
      <Button variant="ghost" size="sm" onClick={onCheck} className="h-7 px-2 text-xs">
        <Globe className="size-3.5" />
        Check {domain}
      </Button>
    );
  }

  if (status === "checking") {
    return (
      <span className="flex items-center gap-1.5 px-2 text-xs text-[var(--fg-muted)]">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Checking…
      </span>
    );
  }

  if (status === "available") {
    return (
      <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-[var(--success)]">
        <Check className="size-3.5" aria-hidden="true" />
        {domain} looks available
      </span>
    );
  }

  if (status === "registered") {
    return (
      <span className="flex items-center gap-1.5 px-2 text-xs text-[var(--fg-muted)]">
        <X className="size-3.5" aria-hidden="true" />
        {domain} is taken
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onCheck}
      className="px-2 text-xs text-[var(--warning)] hover:underline"
    >
      Could not check — retry
    </button>
  );
}
