import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

export const metadata = buildMetadata({
  title: "Privacy Policy — How We Handle Your Files and Data",
  description:
    "How BusinessToolKit handles your files and data. Image and PDF tools process everything in your browser — those files are never uploaded to our servers.",
  path: "/privacy",
});

const localTools = tools.filter((t) => t.privateByDefault);

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <Badge tone="success">
        <ShieldCheck className="size-3" aria-hidden="true" />
        Local-first by design
      </Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--fg-subtle)]">Last updated 17 September 2026</p>

      <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5">
        <h2 className="font-semibold text-[var(--fg)]">The short version</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          {localTools.length} of our {tools.length} tools process your files entirely inside your
          browser. Those files are never transmitted to us, so we could not read, store or lose
          them even if we wanted to. We do not sell data, we do not run third-party trackers, and
          you can use almost everything without an account.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <Section title="1. What this policy covers">
          <p>
            This policy explains what happens to information when you use {siteConfig.name} at{" "}
            {siteConfig.url}. It covers files you open in our tools, information you type into
            them, and the limited technical data our servers see.
          </p>
        </Section>

        <Section title="2. Files you open in our tools">
          <p>
            <strong>Image and PDF tools run entirely on your device.</strong> When you drop a file
            into the Image Compressor, PDF Merger, PDF Splitter, PDF-to-Image converter, Image
            Resizer or Social Media Image Resizer, the file is read by your browser using the File
            API and processed with the browser&apos;s own canvas and PDF libraries. It is never sent
            over the network.
          </p>
          <p>
            You can verify this yourself: open your browser&apos;s network tools, process a file,
            and observe that no upload request is made. The tools also keep working if you
            disconnect from the internet after the page has loaded.
          </p>
          <p>
            Because nothing is uploaded, there is nothing for us to retain, delete or hand over. We
            operate no temporary file storage for these tools.
          </p>
          <ul>
            {localTools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. Information you type into tools">
          <p>
            Invoice and quotation details, calculator inputs, QR code and barcode content, passwords
            and email signature details are all held in your browser&apos;s memory while you use the
            tool. None of it is transmitted to us.
          </p>
          <p>
            If you press <strong>Save</strong> on a document, it is written to your browser&apos;s
            local storage on that device. It stays there until you delete it or clear your browsing
            data. It does not sync between devices and we cannot see it.
          </p>
          <p>
            Generated passwords are never stored anywhere — not in local storage, not in memory
            beyond the page, and not on any server. Closing the tab discards them.
          </p>
        </Section>

        <Section title="4. Tools that do contact a server">
          <p>Three features make a network request, and only these:</p>
          <ul>
            <li>
              <strong>Currency Converter</strong> — your browser asks our server for an exchange
              rate table for a base currency. We send the currency code to the rate provider. The
              amount you are converting is never transmitted; the arithmetic happens in your
              browser.
            </li>
            <li>
              <strong>Business Name Generator</strong> — the industry, keywords and description you
              enter are sent to our server so it can build suggestions. They are used for that
              request and nothing else: not stored, not logged, and not passed to any third party.
            </li>
            <li>
              <strong>Domain availability check</strong> — the domain name being checked is sent to
              public registry (RDAP) and DNS services.
            </li>
          </ul>
        </Section>

        <Section title="5. Technical data">
          <p>
            Like any website, our servers process the IP address, user agent and requested URL
            needed to deliver a page and to apply rate limits that keep the service available. This
            is transient operational data, not a profile.
          </p>
          <p>
            We do not use advertising trackers, third-party analytics scripts, fingerprinting or
            cross-site cookies. Our analytics layer records anonymous counters — which tool was
            opened, whether a download was clicked — with no file names, no file contents, no form
            values and no identifiers. It also respects your browser&apos;s Do Not Track setting.
          </p>
        </Section>

        <Section title="6. Cookies and local storage">
          <p>
            We set no tracking cookies. We use your browser&apos;s local storage for your own
            convenience: your light or dark theme preference, documents you explicitly save, your
            favourite tools and your recently used tools. You can clear all of it at any time from
            the{" "}
            <Link href="/dashboard" className="font-medium text-[var(--accent)] hover:underline">
              dashboard
            </Link>{" "}
            or through your browser settings.
          </p>
        </Section>

        <Section title="7. No accounts">
          <p>
            There is no sign-up, no log-in and no user account. We never ask for your name, email
            address or a password, so there is no profile for us to hold, leak or be compelled to
            hand over. Everything you create stays on your own device.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            This service is intended for business use and is not directed at children under 13. We
            do not knowingly collect information from children.
          </p>
        </Section>

        <Section title="9. Your rights">
          <p>
            Depending on where you live, you may have rights to access, correct, export or delete
            personal data we hold. Because the tools are local-first, in most cases we hold nothing
            about you at all — the data lives on your own device and you can delete it yourself. For
            anything else, contact us at {siteConfig.contactEmail}.
          </p>
        </Section>

        <Section title="10. Changes">
          <p>
            If this policy changes materially we will update the date at the top of this page and
            note the change on our{" "}
            <Link href="/blog" className="font-medium text-[var(--accent)] hover:underline">
              blog
            </Link>
            .
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about this policy can go to {siteConfig.contactEmail}, or through our{" "}
            <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
              contact page
            </Link>
            .
          </p>
        </Section>
      </div>

      <p className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--fg-subtle)]">
        This policy is written to describe how the software actually behaves. It is not legal
        advice, and you should have a solicitor review it against the regulations that apply to you
        before relying on it commercially.
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
