"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Check,
  Download,
  FileDown,
  FolderOpen,
  Link2,
  Printer,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Modal,
  Spinner,
  Tabs,
} from "@/components/ui";
import { DocumentEditor, DocumentStyleControls } from "./editor";
import { DocumentPreview } from "./preview";
import { computeTotals, docLabels, emptyItem, emptyParty, type BusinessDoc, type DocKind } from "./types";
import { repo, useStoredValue, type SavedDocument } from "@/lib/storage";
import { formatMoney } from "@/lib/currencies";
import { addDaysISO, downloadBlob, downloadText, todayISO, uid } from "@/lib/utils";
import { track } from "@/lib/analytics";

function seedDoc(kind: DocKind): BusinessDoc {
  const today = todayISO();
  return {
    kind,
    template: "classic",
    pageSize: "a4",
    accent: "#11224a",
    logo: null,
    signature: null,
    from: emptyParty(),
    to: emptyParty(),
    number: kind === "invoice" ? "INV-0001" : "QTE-0001",
    date: today,
    dueDate: addDaysISO(today, kind === "invoice" ? 30 : 14),
    currency: "USD",
    paymentTerms: kind === "invoice" ? "Net 30" : "Valid for 14 days",
    reference: "",
    items: [emptyItem(uid("li"))],
    notes: "",
    paymentInstructions: "",
    terms: "",
    signatureName: "",
  };
}

/** Shape of the JSON produced by Export data and accepted by Import. */
interface DocumentFile {
  format: "businesstoolkit.document";
  version: 1;
  document: BusinessDoc;
}

export function DocumentTool({
  kind,
  toolSlug,
  /** The PDF Invoice Maker leads with templates and import instead of the form. */
  variant = "editor",
}: {
  kind: DocKind;
  toolSlug: string;
  variant?: "editor" | "pdf";
}) {
  const router = useRouter();
  const labels = docLabels(kind);

  const [doc, setDoc] = React.useState<BusinessDoc>(() => seedDoc(kind));
  const [docId, setDocId] = React.useState<string>(() => uid("doc"));
  const [tab, setTab] = React.useState<"details" | "design">(
    variant === "pdf" ? "design" : "details",
  );
  const [status, setStatus] = React.useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = React.useState(false);
  const [openLibrary, setOpenLibrary] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  const totals = computeTotals(doc);
  const saved = useStoredValue<SavedDocument[]>(() => repo.listDocuments(), []);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  // Auto-clear transient status messages.
  React.useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  const validationError = React.useMemo(() => {
    if (!doc.number.trim()) return `Please enter a ${labels.numberLabel.toLowerCase()}.`;
    if (doc.items.length === 0) return "Add at least one item before exporting.";
    if (doc.items.every((i) => !i.name.trim())) return "Give at least one item a name.";
    return null;
  }, [doc, labels.numberLabel]);

  /* ----------------------------------------------------------- actions -- */

  const handleDownload = async () => {
    if (validationError) {
      setStatus({ tone: "error", text: validationError });
      return;
    }
    setBusy(true);
    try {
      const { renderDocumentPdf } = await import("./pdf");
      const { bytes, filename } = await renderDocumentPdf(doc);
      // Copy into a fresh ArrayBuffer so the Blob owns plain bytes.
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      downloadBlob(new Blob([buffer], { type: "application/pdf" }), filename);
      track("tool_completed", { tool: toolSlug, format: "pdf" });
      track("download_clicked", { tool: toolSlug });
      setStatus({ tone: "success", text: `${filename} downloaded.` });
    } catch {
      setStatus({
        tone: "error",
        text: "The PDF could not be generated. Please check your details and try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    if (validationError) {
      setStatus({ tone: "error", text: validationError });
      return;
    }
    const record: SavedDocument = {
      id: docId,
      kind,
      title: `${doc.number} — ${doc.to.company || doc.to.name || "Untitled customer"}`,
      number: doc.number,
      customer: doc.to.company || doc.to.name || "",
      total: totals.total,
      currency: doc.currency,
      updatedAt: Date.now(),
      data: doc,
    };
    repo.saveDocument(record);
    setStatus({
      tone: "success",
      text: "Saved to this browser. It will be here when you come back.",
    });
  };

  const handleLoad = (record: SavedDocument) => {
    const loaded = record.data as BusinessDoc;
    setDoc({ ...seedDoc(record.kind), ...loaded, kind: record.kind });
    setDocId(record.id);
    setOpenLibrary(false);
    setStatus({ tone: "success", text: `Loaded ${record.number}.` });
  };

  const handleExportData = () => {
    const file: DocumentFile = { format: "businesstoolkit.document", version: 1, document: doc };
    downloadText(
      JSON.stringify(file, null, 2),
      `${labels.filePrefix}-${doc.number || "data"}.json`,
      "application/json",
    );
  };

  const handleImportData = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ tone: "error", text: "That file is too large to be document data." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<DocumentFile>;
        const incoming = parsed?.document;
        if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.items)) {
          throw new Error("unrecognised");
        }
        // Merge over a fresh seed so a partial or older file can't leave holes.
        setDoc({
          ...seedDoc(kind),
          ...incoming,
          kind,
          items: incoming.items.map((item) => ({ ...emptyItem(uid("li")), ...item })),
        });
        setStatus({ tone: "success", text: "Document data imported." });
      } catch {
        setStatus({
          tone: "error",
          text: "That file isn't valid document data. Export one first to see the expected format.",
        });
      }
    };
    reader.onerror = () => setStatus({ tone: "error", text: "That file could not be read." });
    reader.readAsText(file);
  };

  const handleShare = async () => {
    const summary =
      `${labels.title} ${doc.number}\n` +
      `${doc.from.company || doc.from.name}\n` +
      `${labels.totalLabel}: ${formatMoney(totals.total, doc.currency)}\n` +
      `${labels.dueLabel}: ${doc.dueDate}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${labels.title} ${doc.number}`, text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      setStatus({ tone: "success", text: "Summary copied to your clipboard." });
    } catch {
      // A cancelled share sheet is not an error worth reporting.
    }
  };

  const handleConvert = () => {
    const today = todayISO();
    const converted: BusinessDoc = {
      ...doc,
      kind: "invoice",
      number: doc.number.replace(/^QTE/i, "INV") || "INV-0001",
      reference: doc.number ? `Quote ${doc.number}` : doc.reference,
      date: today,
      dueDate: addDaysISO(today, 30),
      paymentTerms: "Net 30",
    };
    try {
      sessionStorage.setItem("btk:convert", JSON.stringify(converted));
    } catch {
      // Falls back to an empty invoice if session storage is unavailable.
    }
    router.push("/tools/invoice-generator?from=quote");
  };

  // Pick up a quotation handed over by the convert action.
  React.useEffect(() => {
    if (kind !== "invoice") return;
    try {
      const raw = sessionStorage.getItem("btk:convert");
      if (!raw) return;
      sessionStorage.removeItem("btk:convert");
      const incoming = JSON.parse(raw) as BusinessDoc;
      setDoc({ ...seedDoc("invoice"), ...incoming, kind: "invoice" });
      setStatus({ tone: "success", text: "Quotation converted — check the dates and number." });
    } catch {
      // Ignore malformed handover data.
    }
  }, [kind]);

  const handleReset = () => {
    setDoc(seedDoc(kind));
    setDocId(uid("doc"));
    setStatus({ tone: "success", text: "Started a new document." });
  };

  /* -------------------------------------------------------------- view -- */

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Controls */}
      <div className="min-w-0 space-y-4 no-print">
        <Card className="overflow-hidden">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "details", label: "Details" },
              { value: "design", label: "Design" },
            ]}
            className="px-2"
          />
          <div className="p-5">
            {tab === "design" ? (
              <DocumentStyleControls doc={doc} onChange={setDoc} />
            ) : (
              <p className="text-sm text-[var(--fg-muted)]">
                Fill in the sections below. The preview updates as you type.
              </p>
            )}
          </div>
        </Card>

        {tab === "details" && <DocumentEditor doc={doc} onChange={setDoc} />}
      </div>

      {/* Preview + actions */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="no-print">
          <div className="space-y-3 p-4">
            {status && <Alert tone={status.tone}>{status.text}</Alert>}
            {!status && validationError && <Alert tone="warning">{validationError}</Alert>}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload} disabled={busy} className="flex-1 sm:flex-none">
                {busy ? <Spinner /> : <Download />}
                {busy ? "Building PDF…" : "Download PDF"}
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer />
                Print
              </Button>
              <Button variant="outline" onClick={handleSave}>
                <Save />
                Save
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Link2 />
                Share
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
              <Button variant="ghost" size="sm" onClick={() => setOpenLibrary(true)}>
                <FolderOpen className="size-3.5" />
                Saved ({saved.value.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
                <Upload className="size-3.5" />
                Import data
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportData}>
                <FileDown className="size-3.5" />
                Export data
              </Button>
              {kind === "quote" && (
                <Button variant="ghost" size="sm" onClick={handleConvert}>
                  <ArrowRightLeft className="size-3.5" />
                  Convert to invoice
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleReset} className="ml-auto">
                <RotateCcw className="size-3.5" />
                New
              </Button>
            </div>

            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                handleImportData(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            <dl className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
              <div>
                <dt className="text-xs text-[var(--fg-subtle)]">Items</dt>
                <dd className="tabular text-sm font-semibold">{totals.itemCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--fg-subtle)]">Tax</dt>
                <dd className="tabular text-sm font-semibold">
                  {formatMoney(totals.taxTotal, doc.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--fg-subtle)]">{labels.totalLabel}</dt>
                <dd className="tabular text-sm font-semibold text-[var(--accent)]">
                  {formatMoney(totals.total, doc.currency)}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-muted)] p-3 no-print sm:p-5">
          <DocumentPreview doc={doc} />
        </div>

        {/* Hidden off-screen copy that the browser Print dialog captures cleanly. */}
        <div className="hidden print:block">
          <DocumentPreview doc={doc} />
        </div>
      </div>

      <Modal
        open={openLibrary}
        onClose={() => setOpenLibrary(false)}
        title="Saved documents"
        size="lg"
      >
        {saved.value.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="size-8" />}
            title="Nothing saved yet"
            description="Press Save on a document and it will appear here. Saved documents live in this browser only."
          />
        ) : (
          <ul className="space-y-2">
            {saved.value.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-[var(--fg-subtle)]">
                    {record.kind === "invoice" ? "Invoice" : "Quotation"} ·{" "}
                    {formatMoney(record.total, record.currency)} ·{" "}
                    {new Date(record.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleLoad(record)}>
                  <Check className="size-3.5" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--error)]"
                  onClick={() => repo.deleteDocument(record.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
