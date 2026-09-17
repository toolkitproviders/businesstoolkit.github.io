import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms that apply when you use BusinessToolKit's free online business tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--fg-subtle)]">Last updated 17 September 2026</p>

      <div className="mt-10 space-y-8">
        <Section title="1. Agreement">
          <p>
            By using {siteConfig.name} you agree to these terms. If you do not agree, please do not
            use the service.
          </p>
        </Section>

        <Section title="2. The service">
          <p>
            We provide free online tools for creating documents and processing files. Most tools run
            entirely in your browser, as described in our{" "}
            <Link href="/privacy" className="font-medium text-[var(--accent)] hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <p>
            We may change, suspend or discontinue any part of the service. We will try to give
            reasonable notice of significant changes, but the service is provided free and without
            a guarantee of continued availability.
          </p>
        </Section>

        <Section title="3. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>Use the tools to create fraudulent documents, or to impersonate a business or person.</li>
            <li>Upload or process content you do not have the right to use.</li>
            <li>Attempt to disrupt the service, bypass rate limits, or probe it for vulnerabilities without permission.</li>
            <li>Scrape or resell the service, or present it as your own.</li>
            <li>Use it for anything unlawful where you are.</li>
          </ul>
        </Section>

        <Section title="4. Your content">
          <p>
            You keep all rights to the files and information you use with our tools. Because most
            tools run locally, in most cases we never receive your content at all. We claim no
            licence over it.
          </p>
          <p>
            You are responsible for the accuracy of documents you create — an invoice or quotation
            produced here is your document, issued by you.
          </p>
        </Section>

        <Section title="5. No professional advice">
          <p>
            The calculators and generators are informational tools, not professional advice. Tax
            rates, salary deductions and profit figures depend on rules we cannot model for every
            jurisdiction. Verify anything that matters with a qualified accountant, tax adviser or
            solicitor before relying on it.
          </p>
          <p>
            Generated business names may already be registered, trademarked or in use. Check before
            adopting one. Barcodes must use numbers legitimately assigned to you by GS1 if products
            are sold at retail.
          </p>
        </Section>

        <Section title="6. Availability and warranty">
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
            warranties of any kind, express or implied, including fitness for a particular purpose.
            We do not warrant that it will be uninterrupted, error-free, or that output will meet
            your requirements.
          </p>
          <p>
            Keep your own copies of anything important. Documents saved in browser storage can be
            lost by clearing browsing data, using private browsing, or switching device.
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            To the maximum extent permitted by law, we are not liable for indirect, incidental or
            consequential losses, or for lost profits, revenue or data arising from your use of the
            service. Nothing here limits liability that cannot lawfully be limited.
          </p>
        </Section>

        <Section title="8. Cost">
          <p>
            The service is free. There are no paid plans, no subscriptions, no trials and no
            feature gates — every tool is available to everyone at no charge.
          </p>
        </Section>

        <Section title="9. Changes to these terms">
          <p>
            We may update these terms. Continued use after an update means you accept the revised
            terms. The date above always reflects the current version.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms can go to {siteConfig.contactEmail}.
          </p>
        </Section>
      </div>

      <p className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--fg-subtle)]">
        These terms are a starting point, not legal advice. Have a solicitor review them against
        the law where you operate before relying on them commercially.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--fg-muted)] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
