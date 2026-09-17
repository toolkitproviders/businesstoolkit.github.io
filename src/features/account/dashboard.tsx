"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  FileText,
  FolderOpen,
  Heart,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Alert, Button, EmptyState, Stat, Tabs } from "@/components/ui";
import { ToolCardCompact } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import { repo, useStoredValue, type RecentToolEntry, type SavedDocument } from "@/lib/storage";
import { formatMoney } from "@/lib/currencies";
import { getTool, popularTools, tools } from "@/lib/tools";

type Tab = "overview" | "documents" | "favourites" | "settings";

export function Dashboard() {
  const [tab, setTab] = React.useState<Tab>("overview");

  const documents = useStoredValue<SavedDocument[]>(() => repo.listDocuments(), []);
  const favourites = useStoredValue<string[]>(() => repo.listFavourites(), []);
  const recent = useStoredValue<RecentToolEntry[]>(() => repo.listRecentTools(), []);

  const invoices = documents.value.filter((d) => d.kind === "invoice");
  const quotes = documents.value.filter((d) => d.kind === "quote");
  const recentTools = recent.value
    .map((entry) => ({ tool: getTool(entry.slug), at: entry.at }))
    .filter((e): e is { tool: NonNullable<ReturnType<typeof getTool>>; at: number } =>
      Boolean(e.tool),
    );
  const favouriteTools = favourites.value
    .map((slug) => getTool(slug))
    .filter((t) => t !== undefined);

  // Everything renders after the storage effect, so SSR and hydration agree.
  const ready = documents.ready;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-[var(--fg-muted)]">
            Your saved documents, favourite tools and recent activity.
          </p>
        </div>
        <Link
          href="/tools/invoice-generator"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"
        >
          <FileText className="size-4" />
          New invoice
        </Link>
      </div>

      <Alert tone="info" className="mt-6">
        There are no accounts — everything here is stored in this browser, on this device. Nothing
        is uploaded and nothing syncs between devices, so clearing your site data clears it. Use
        Export data in the invoice and quotation tools to keep a copy you control.
      </Alert>

      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "documents", label: "Documents", count: documents.value.length },
          { value: "favourites", label: "Favourites", count: favourites.value.length },
          { value: "settings", label: "Settings" },
        ]}
      />

      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Saved invoices" value={ready ? invoices.length : "—"} />
              <Stat label="Saved quotations" value={ready ? quotes.length : "—"} />
              <Stat
                label="Favourite tools"
                value={ready ? favourites.value.length : "—"}
                tone="accent"
              />
              <Stat label="Tools used" value={ready ? recent.value.length : "—"} />
            </div>

            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Clock className="size-4 text-[var(--fg-subtle)]" aria-hidden="true" />
                Recent tools
              </h2>
              {recentTools.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--fg-muted)]">
                  Tools you open will appear here.{" "}
                  <Link href="/tools" className="font-medium text-[var(--accent)] hover:underline">
                    Browse all {tools.length}
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {recentTools.slice(0, 6).map(({ tool }) => (
                    <li key={tool.slug}>
                      <ToolCardCompact tool={tool} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4 text-[var(--fg-subtle)]" aria-hidden="true" />
                Popular tools
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {popularTools.map((tool) => (
                  <li key={tool.slug}>
                    <ToolCardCompact tool={tool} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === "documents" && (
          <DocumentList documents={documents.value} ready={ready} />
        )}

        {tab === "favourites" && (
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
            {favouriteTools.length === 0 ? (
              <EmptyState
                icon={<Heart className="size-8" />}
                title="No favourite tools yet"
                description="Favourites make the tools you use most reachable in one click."
                action={
                  <Link
                    href="/tools"
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    Browse all tools
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {favouriteTools.map((tool) => (
                  <li key={tool.slug} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <ToolCardCompact tool={tool} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${tool.name} from favourites`}
                      onClick={() => repo.toggleFavourite(tool.slug)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "settings" && <SettingsPanel documentCount={documents.value.length} />}
      </div>
    </div>
  );
}

function DocumentList({ documents, ready }: { documents: SavedDocument[]; ready: boolean }) {
  if (!ready) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--fg-muted)]">
        Loading your documents…
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <EmptyState
          icon={<FolderOpen className="size-8" />}
          title="No saved documents"
          description="Press Save in the invoice or quotation generator and documents will appear here."
          action={
            <div className="flex gap-2">
              <Link
                href="/tools/invoice-generator"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Create an invoice
              </Link>
              <span className="text-[var(--fg-subtle)]">·</span>
              <Link
                href="/tools/quotation-generator"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Create a quotation
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <caption className="sr-only">Saved invoices and quotations</caption>
        <thead className="bg-[var(--bg-subtle)]">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--fg-muted)]">
              Document
            </th>
            <th scope="col" className="hidden px-4 py-3 text-left font-medium text-[var(--fg-muted)] sm:table-cell">
              Type
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-[var(--fg-muted)]">
              Total
            </th>
            <th scope="col" className="hidden px-4 py-3 text-right font-medium text-[var(--fg-muted)] md:table-cell">
              Updated
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-[var(--fg-muted)]">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {documents.map((doc) => {
            const tool = getTool(
              doc.kind === "invoice" ? "invoice-generator" : "quotation-generator",
            );
            return (
              <tr key={doc.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {tool && <ToolIcon icon={tool.icon} category={tool.category} size="sm" />}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.number}</p>
                      <p className="truncate text-xs text-[var(--fg-subtle)]">
                        {doc.customer || "No customer"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-[var(--fg-muted)] sm:table-cell">
                  {doc.kind === "invoice" ? "Invoice" : "Quotation"}
                </td>
                <td className="tabular px-4 py-3 text-right font-medium">
                  {formatMoney(doc.total, doc.currency)}
                </td>
                <td className="hidden px-4 py-3 text-right text-[var(--fg-muted)] md:table-cell">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={
                        doc.kind === "invoice"
                          ? "/tools/invoice-generator"
                          : "/tools/quotation-generator"
                      }
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-subtle)]"
                    >
                      Open tool
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-[var(--error)]"
                      aria-label={`Delete ${doc.number}`}
                      onClick={() => repo.deleteDocument(doc.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-xs text-[var(--fg-subtle)]">
        Open the relevant tool and press <strong>Saved</strong> to load a document back into the
        editor.
      </p>
    </div>
  );
}

function SettingsPanel({ documentCount }: { documentCount: number }) {
  const [cleared, setCleared] = React.useState(false);

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Settings className="size-4 text-[var(--fg-subtle)]" aria-hidden="true" />
          Your data
        </h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          {documentCount} document{documentCount === 1 ? "" : "s"}, plus your favourites and recent
          tools, are stored in this browser. Nothing has been uploaded to a server.
        </p>

        {cleared && (
          <Alert tone="success" className="mt-4">
            Local data cleared from this browser.
          </Alert>
        )}

        <Button
          variant="danger"
          className="mt-4"
          onClick={() => {
            for (const doc of repo.listDocuments()) repo.deleteDocument(doc.id);
            for (const slug of repo.listFavourites()) repo.toggleFavourite(slug);
            setCleared(true);
          }}
        >
          <Trash2 />
          Clear all local data
        </Button>
      </section>
    </div>
  );
}
