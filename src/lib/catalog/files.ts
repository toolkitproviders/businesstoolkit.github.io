import type { Tool } from "@/lib/tool-types";

/**
 * File tools. Every one reads the file with the browser's own FileReader and
 * works on it in the page — nothing is uploaded.
 */
export const fileTools: Tool[] = [
  {
    slug: "csv-viewer",
    name: "CSV Viewer",
    tagline: "Open a CSV as a readable table, without a spreadsheet.",
    description:
      "Paste or open a CSV and see it as a proper table, with the delimiter detected automatically and a warning on any row whose quoting has gone wrong.",
    category: "files",
    icon: "table",
    keywords: [
      "csv viewer", "open csv", "csv reader", "view csv online",
      "csv to table", "read csv file", "tsv viewer",
    ],
    seoTitle: "CSV Viewer — Open and Read a CSV as a Table",
    seoDescription:
      "Open a CSV or TSV as a readable table with automatic delimiter detection and quoting checks. Your file is processed locally in your browser.",
    faq: [
      {
        q: "Is my file uploaded?",
        a: "No. The file is read by your browser with FileReader and parsed in the page. It never leaves your device, which is what makes this safe for customer or payroll data.",
      },
      {
        q: "Why does it say a row has the wrong number of fields?",
        a: "Almost always an unescaped quote or a comma inside an unquoted value. The message gives the line number so you can find it.",
      },
      {
        q: "Which delimiters are supported?",
        a: "Comma, semicolon, tab and pipe. It picks whichever divides the first few lines most consistently, and you can override it.",
      },
    ],
    related: ["csv-to-json", "json-to-csv", "text-file-viewer", "json-formatter"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "csv-to-json",
    name: "CSV to JSON Converter",
    tagline: "Turn a spreadsheet export into JSON.",
    description:
      "Convert CSV into an array of objects, an array of arrays or a column map, reading numbers and true/false as real JSON values rather than strings.",
    category: "files",
    icon: "file-json",
    keywords: [
      "csv to json", "convert csv to json", "csv json converter",
      "spreadsheet to json", "excel to json", "tsv to json",
    ],
    seoTitle: "CSV to JSON Converter — Three Output Shapes, Free",
    seoDescription:
      "Convert CSV to JSON as objects, arrays or columns, with numbers and booleans typed properly. Runs entirely in your browser — nothing is uploaded.",
    faq: [
      {
        q: "Which output shape should I pick?",
        a: "An array of objects is what most APIs and scripts expect. Arrays are more compact for large exports, and the column map suits charting libraries.",
      },
      {
        q: "Why is my postcode or phone number turned into something odd?",
        a: "Type coercion reads anything that looks like a number as one. Values with leading zeros stay strings, but turn the option off if a column must be text throughout.",
      },
      {
        q: "Does it handle quoted fields with commas in them?",
        a: "Yes. The parser follows RFC 4180, so quoted fields can contain the delimiter, line breaks and escaped double quotes.",
      },
    ],
    related: ["json-to-csv", "csv-viewer", "json-formatter", "json-validator"],
    privateByDefault: true,
  },
  {
    slug: "json-to-csv",
    name: "JSON to CSV Converter",
    tagline: "Flatten an API response into a spreadsheet.",
    description:
      "Turn an array of JSON objects into CSV, flattening nested objects into dot paths and taking the columns from the union of every record's keys.",
    category: "files",
    icon: "file-spreadsheet",
    keywords: [
      "json to csv", "convert json to csv", "json csv converter",
      "api response to spreadsheet", "json to excel", "flatten json",
    ],
    seoTitle: "JSON to CSV Converter — Flatten JSON for Excel",
    seoDescription:
      "Convert an array of JSON objects to CSV, flattening nested values into dot paths, with an Excel-friendly byte order mark option.",
    faq: [
      {
        q: "What happens to nested objects?",
        a: "They are flattened into dot paths, so { customer: { name: \"Ada\" } } becomes a column called customer.name. Turn that off and nested values are written as JSON strings.",
      },
      {
        q: "Why does Excel mangle the accents?",
        a: "Excel on Windows assumes the local code page unless the file starts with a byte order mark. Tick that option and accented characters come through correctly.",
      },
      {
        q: "My JSON is an object, not an array. Will it work?",
        a: "Yes. If the object has exactly one array property, that array is used as the records — which is how most API responses are shaped.",
      },
    ],
    related: ["csv-to-json", "csv-viewer", "json-formatter", "json-validator"],
    privateByDefault: true,
  },
  {
    slug: "text-file-viewer",
    name: "Text File Viewer",
    tagline: "Open a log or config file with line numbers.",
    description:
      "Open any text file in your browser and page through it with line numbers, plus a read-out of its line endings, longest line and non-ASCII characters.",
    category: "files",
    icon: "file-input",
    keywords: [
      "text file viewer", "open txt file", "log file viewer", "read text file",
      "view file online", "line numbers", "file reader",
    ],
    seoTitle: "Text File Viewer — Read Any Text File With Line Numbers",
    seoDescription:
      "Open a text, log or config file with line numbers and jump to any line, plus line-ending and encoding details. Processed locally in your browser.",
    faq: [
      {
        q: "How big a file can I open?",
        a: "Up to about 2 MB of text comfortably. Past that the browser slows down; use the line range to look at part of a bigger file.",
      },
      {
        q: "Why does it matter which line endings a file uses?",
        a: "Mixed endings make version control show a whole file as changed and can break shell scripts. The Text File Converter normalises them in one click.",
      },
      {
        q: "Is the file uploaded to be displayed?",
        a: "No. Your file is processed locally in your browser — it is read into memory on your device and nothing is transmitted.",
      },
    ],
    related: ["text-file-converter", "csv-viewer", "word-counter", "file-information-viewer"],
    privateByDefault: true,
  },
  {
    slug: "text-file-converter",
    name: "Text File Converter",
    tagline: "Fix line endings, tabs, trailing spaces and BOMs.",
    description:
      "Normalise a text file for another system: convert line endings between LF and CRLF, swap tabs and spaces, strip trailing whitespace and add or remove the byte order mark.",
    category: "files",
    icon: "file-output",
    keywords: [
      "convert line endings", "crlf to lf", "lf to crlf", "dos2unix online",
      "remove bom", "tabs to spaces", "text file converter",
    ],
    seoTitle: "Text File Converter — Line Endings, Tabs and BOM",
    seoDescription:
      "Convert line endings between LF and CRLF, swap tabs and spaces, strip trailing whitespace and add or remove a byte order mark. All in your browser.",
    faq: [
      {
        q: "What is dos2unix and does this do it?",
        a: "dos2unix converts Windows CRLF line endings to Unix LF. Choosing LF here does exactly that, and choosing CRLF does the reverse.",
      },
      {
        q: "Should I add a byte order mark?",
        a: "Only for Excel. Most parsers, shells and compilers treat it as a stray invisible character at the start of the file, which causes odd errors.",
      },
      {
        q: "Why strip trailing spaces?",
        a: "They create noisy diffs, and in some languages a trailing space after a line continuation is a genuine bug. Most editors strip them on save for the same reason.",
      },
    ],
    related: ["text-file-viewer", "remove-extra-spaces", "text-cleaner", "csv-viewer"],
    privateByDefault: true,
  },
  {
    slug: "file-information-viewer",
    name: "File Information Viewer",
    tagline: "See what a file really is, whatever it is named.",
    description:
      "Drop any file to see its true type read from its first bytes, its exact size, when it was last modified and its SHA-256 checksum — with a warning when the extension does not match the contents.",
    category: "files",
    icon: "file-search",
    keywords: [
      "file information", "file type checker", "what file is this",
      "magic number", "file signature", "sha256 checksum file", "file metadata",
    ],
    seoTitle: "File Information Viewer — Real Type, Size and Checksum",
    seoDescription:
      "Identify any file from its magic bytes, see its exact size, modified date and SHA-256 checksum, and spot a mismatched extension. Nothing is uploaded.",
    faq: [
      {
        q: "How can it tell what a file really is?",
        a: "Most formats begin with a fixed signature — PNG starts with the bytes 89 50 4E 47, a PDF with %PDF-. Those bytes reflect the contents; the extension is only a label.",
      },
      {
        q: "Why does my .docx show as a ZIP archive?",
        a: "Because it is one. Modern Office documents, ODF files and EPUBs are all ZIP containers holding XML, so they share the ZIP signature.",
      },
      {
        q: "What is the checksum for?",
        a: "Comparing a download against the SHA-256 the publisher lists proves the file arrived intact and unmodified. It is computed on your device using the browser's own cryptography.",
      },
    ],
    related: ["hash-generator", "text-file-viewer", "image-dimensions-checker", "data-storage-converter"],
    privateByDefault: true,
  },
];
