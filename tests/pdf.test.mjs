// Exercises the SHIPPED src/features/pdf/core.ts logic (pdf-lib paths).
import { PDFDocument } from "pdf-lib";
import {
  inspectPdf,
  mergePdfs,
  extractPages,
  parsePageRanges,
  PdfError,
} from "../src/features/pdf/core.ts";

/** A real, minimal PDF built with pdf-lib, so the tests need no fixture files. */
async function makeFixture(pages) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) doc.addPage([595.28, 841.89]);
  return Buffer.from(await doc.save());
}

const a = await makeFixture(1);
const b = await makeFixture(1);

// Node has File since 20; core.ts only uses file.arrayBuffer() and file.name.
const fileA = new File([a], "a.pdf", { type: "application/pdf" });

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("  PASS", name, extra); }
  else { fail++; console.log("  FAIL", name, extra); }
};

console.log("\ninspectPdf");
const info = await inspectPdf(fileA, "a.pdf");
check("reports page count", info.pageCount === 1, `got ${info.pageCount}`);
check("returns bytes", info.bytes.length === a.length, `got ${info.bytes.length}`);

console.log("\nparsePageRanges");
{
  const r = parsePageRanges("1-3, 5, 8-10", 12);
  check("parses spans and singles", r.ranges.length === 3 && r.errors.length === 0);
  check("expands 1-3", JSON.stringify(r.ranges[0].indices) === "[0,1,2]");
  check("single page 5 -> index 4", JSON.stringify(r.ranges[1].indices) === "[4]");
}
{
  const r = parsePageRanges("5-2", 12);
  check("reversed span is normalised", r.ranges[0]?.label === "2-5" && r.ranges[0].indices.length === 4);
}
{
  const r = parsePageRanges("1-99", 10);
  check("rejects out-of-range", r.ranges.length === 0 && r.errors.length === 1, r.errors[0] ?? "");
}
{
  const r = parsePageRanges("abc", 10);
  check("rejects garbage", r.ranges.length === 0 && /isn't a page or a range/.test(r.errors[0] ?? ""));
}
{
  const r = parsePageRanges("0", 10);
  check("rejects page 0", r.ranges.length === 0 && r.errors.length === 1);
}

console.log("\nmergePdfs");
const merged = await mergePdfs([
  { name: "a.pdf", bytes: new Uint8Array(a) },
  { name: "b.pdf", bytes: new Uint8Array(b) },
]);
const mergedDoc = await PDFDocument.load(merged);
check("merged has 2 pages", mergedDoc.getPageCount() === 2, `got ${mergedDoc.getPageCount()}`);
check("sets creator", mergedDoc.getCreator() === "BusinessToolKit PDF Merger");
try {
  await mergePdfs([{ name: "a.pdf", bytes: new Uint8Array(a) }]);
  check("rejects single-file merge", false);
} catch (e) {
  check("rejects single-file merge", e instanceof PdfError, e.message);
}

console.log("\nextractPages");
const threePage = await (async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) doc.addPage([300, 400]);
  return doc.save();
})();
const extracted = await extractPages(threePage, [0, 2], "three.pdf");
const extractedDoc = await PDFDocument.load(extracted);
check("extracts 2 of 3 pages", extractedDoc.getPageCount() === 2, `got ${extractedDoc.getPageCount()}`);
try {
  await extractPages(threePage, [], "three.pdf");
  check("rejects empty selection", false);
} catch (e) { check("rejects empty selection", e instanceof PdfError); }
try {
  await extractPages(threePage, [99], "three.pdf");
  check("rejects all-invalid indices", false);
} catch (e) { check("rejects all-invalid indices", e instanceof PdfError, e.message); }

console.log("\ncorrupt input");
try {
  await inspectPdf(new File([Buffer.from("not a pdf at all")], "bad.pdf"), "bad.pdf");
  check("rejects non-PDF", false);
} catch (e) { check("rejects non-PDF", e instanceof PdfError, `"${e.message}"`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
