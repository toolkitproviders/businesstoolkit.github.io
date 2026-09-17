import Link from "next/link";
import { Bug, Heart, Lightbulb, Server, Share2, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";
import { DonationDetails } from "./details";

export const metadata = buildMetadata({
  title: "Support BusinessToolKit",
  description: `All ${tools.length} tools are free, with no ads, no accounts and no tracking. If they save you time, a donation keeps them that way.`,
  path: "/donate",
  keywords: ["donate", "support", "free tools", "no ads"],
});

const FREE_WAYS = [
  {
    icon: Share2,
    title: "Tell someone",
    body: "A link to the tool that solved your problem is worth more than most donations. Word of mouth is the only marketing here.",
  },
  {
    icon: Bug,
    title: "Report what breaks",
    body: "Tell us which tool, which browser and what you were doing. A reproducible bug gets fixed quickly.",
  },
  {
    icon: Lightbulb,
    title: "Suggest a tool",
    body: "Most of what is here started as someone asking for it. If something is missing, say so.",
  },
];

export default function DonatePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Support", path: "/donate" },
        ])}
      />

      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page max-w-3xl py-12 sm:py-16">
          <Badge tone="accent">
            <Heart className="size-3.5" aria-hidden="true" />
            Support the project
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            We make it for you, with your help
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--fg-muted)]">
            All {tools.length} tools on this site are free. No ads, no accounts, no trial that
            expires, and nothing held back behind a paid tier. Most of them run entirely in your
            browser, so your files and your data never reach a server at all.
          </p>
          <p className="mt-3 leading-relaxed text-[var(--fg-muted)]">
            That is a deliberate choice, and it is the reason there is no revenue behind it. If
            something here saved you an afternoon, a donation keeps it running for the next person.
          </p>
        </div>
      </div>

      <div className="container-page max-w-3xl space-y-12 py-12">
        <section>
          <h2 className="text-xl font-semibold">Where the money goes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <Server className="size-5 text-[var(--accent)]" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Hosting and the domain</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                The running costs are small, because the tools do their work on your device rather
                than on a server we have to pay for. Small is not nothing.
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <ShieldCheck className="size-5 text-[var(--accent)]" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Staying free of ads</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                Ad networks and analytics are the usual way a site like this pays for itself. Both
                mean tracking you. Donations are what makes refusing them possible.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Donate by bank transfer</h2>
          <p className="mt-2 text-[var(--fg-muted)]">
            Any amount, one-off, from a US bank or anywhere that can send to a US account. There is
            no minimum and no recurring option.
          </p>

          <div className="mt-5">
            <DonationDetails />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--fg-subtle)]">
            Please include your name as the reference if you would like to be thanked. Donations are
            a gift, not a purchase: they buy no features, no support commitment and no priority, and
            they are not tax-deductible — {siteConfig.name} is not a registered charity. Every tool
            on the site is free whether you donate or not, and always will be.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Ways to help that cost nothing</h2>
          <p className="mt-2 text-[var(--fg-muted)]">
            Genuinely — these are worth as much as a donation, and several of them more.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {FREE_WAYS.map((way) => (
              <div
                key={way.title}
                className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <way.icon className="size-5 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{way.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{way.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--fg-muted)]">
            Bugs and suggestions go to{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {siteConfig.contactEmail}
            </a>
            , or through the{" "}
            <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
              contact page
            </Link>
            .
          </p>
        </section>

        <section className="rounded-[var(--radius-card)] bg-navy-900 p-6 text-center dark:bg-navy-800">
          <p className="text-lg font-semibold text-white">
            Not ready to donate? Just use the tools.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-200">
            That is what they are for. Nothing here is metered, and nothing changes if you never
            give a penny.
          </p>
          <ButtonLink
            href="/tools"
            className="mt-5 bg-white text-navy-900 hover:bg-navy-100"
          >
            Browse all {tools.length} tools
          </ButtonLink>
        </section>
      </div>
    </>
  );
}
