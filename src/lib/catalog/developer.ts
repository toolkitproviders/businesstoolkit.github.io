import type { Tool } from "@/lib/tool-types";

/**
 * Developer and IT tools.
 *
 * All of them run on the device. The three formatters that need a real parser
 * load it lazily, so no other page on the site pays for them.
 */
export const developerTools: Tool[] = [
  /* ------------------------------------------------------------------ JSON */
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    tagline: "Indent, sort and check JSON in one place.",
    description:
      "Paste minified or messy JSON and get it properly indented, with a plain-English message pointing at the line when something is wrong.",
    category: "developer",
    icon: "braces",
    keywords: [
      "json formatter", "json beautifier", "format json", "pretty print json",
      "json viewer", "indent json", "json pretty",
    ],
    seoTitle: "JSON Formatter — Beautify and Validate JSON Online",
    seoDescription:
      "Format and indent JSON with 2 spaces, 4 spaces or tabs, optionally sorting keys, with clear errors when it is invalid. Runs entirely in your browser.",
    faq: [
      {
        q: "Is my JSON uploaded anywhere?",
        a: "No. Parsing and formatting use your browser's own JSON engine, so API responses, tokens and customer data never leave the device.",
      },
      {
        q: "Why does my JSON fail with a trailing comma?",
        a: "JSON does not allow trailing commas or comments, even though JavaScript does. Remove the comma after the last item and it will parse.",
      },
      {
        q: "What does sorting keys do?",
        a: "It orders every object's keys alphabetically, all the way down. That makes two API responses far easier to compare by eye or with the diff checker.",
      },
    ],
    related: ["json-minifier", "json-validator", "text-diff-checker", "xml-formatter"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "json-minifier",
    name: "JSON Minifier",
    tagline: "Strip every unnecessary byte from a JSON payload.",
    description:
      "Remove whitespace and line breaks from JSON to cut its size before sending it over the wire, and see exactly how many bytes you saved.",
    category: "developer",
    icon: "minimize-2",
    keywords: ["json minifier", "minify json", "compress json", "json compact", "reduce json size"],
    seoTitle: "JSON Minifier — Compress JSON to Its Smallest Form",
    seoDescription:
      "Minify JSON by removing all whitespace, and see the byte count before and after. Free JSON compressor that runs entirely in your own browser.",
    faq: [
      {
        q: "Does minifying change the data?",
        a: "No. The JSON is parsed and re-serialised, so the structure and values are identical — only the formatting whitespace is gone.",
      },
      {
        q: "How much smaller will it get?",
        a: "Indented JSON is typically 20–40% whitespace. The saving is shown as a percentage after each run so you can see the real figure for your payload.",
      },
    ],
    related: ["json-formatter", "json-validator", "css-minifier", "html-minifier"],
    privateByDefault: true,
  },
  {
    slug: "json-validator",
    name: "JSON Validator",
    tagline: "Check JSON is valid and see how it is structured.",
    description:
      "Validate JSON against the specification and get a structural summary — root type, key count, nesting depth and size — with a clear message when it fails.",
    category: "developer",
    icon: "shield-check",
    keywords: ["json validator", "validate json", "json checker", "is my json valid", "json syntax check"],
    seoTitle: "JSON Validator — Check JSON Syntax and Structure",
    seoDescription:
      "Validate JSON instantly and see its root type, key count, nesting depth and size, with a plain-English error when it is not valid. All in your browser.",
    faq: [
      {
        q: "Which standard does it check against?",
        a: "RFC 8259, the JSON specification, using the browser's own parser. That is the same parser your JavaScript code will use, so the verdict matches production.",
      },
      {
        q: "Does it validate against a schema?",
        a: "No — this checks syntax and structure, not whether the data matches a JSON Schema. It will tell you the shape so you can compare it to what you expected.",
      },
    ],
    related: ["json-formatter", "json-minifier", "xml-formatter", "jwt-decoder"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------------- XML */
  {
    slug: "xml-formatter",
    name: "XML Formatter",
    tagline: "Indent XML and check it is well formed.",
    description:
      "Turn a single line of XML into a readable, properly indented document, and get told immediately if the browser's parser considers it malformed.",
    category: "developer",
    icon: "code-xml",
    keywords: ["xml formatter", "xml beautifier", "format xml", "pretty print xml", "indent xml", "xml viewer"],
    seoTitle: "XML Formatter — Beautify and Check XML Online",
    seoDescription:
      "Indent XML into a readable document and check it is well formed, with attributes, CDATA and comments left untouched. Processed in your browser.",
    faq: [
      {
        q: "Does it handle attributes containing a > character?",
        a: "Yes. The tokeniser tracks quoted attribute values, so a greater-than sign inside an attribute does not end the tag early.",
      },
      {
        q: "What does “well formed” mean?",
        a: "That the tags nest correctly and the syntax is valid. It is not the same as valid against a DTD or XSD schema, which this tool does not check.",
      },
    ],
    related: ["xml-minifier", "json-formatter", "html-formatter", "json-validator"],
    privateByDefault: true,
  },
  {
    slug: "xml-minifier",
    name: "XML Minifier",
    tagline: "Remove whitespace and comments from XML.",
    description:
      "Compress an XML document by removing the whitespace between elements and stripping comments, leaving the content of every element untouched.",
    category: "developer",
    icon: "minimize-2",
    keywords: ["xml minifier", "minify xml", "compress xml", "strip xml whitespace"],
    seoTitle: "XML Minifier — Compress XML by Removing Whitespace",
    seoDescription:
      "Minify XML by stripping the whitespace between elements and removing comments, with element content preserved exactly. Runs in your browser.",
    faq: [
      {
        q: "Will it change my element text?",
        a: "Text inside an element is kept, with runs of whitespace collapsed to a single space. Whitespace between elements — which carries no meaning — is removed.",
      },
      {
        q: "Can I minify an SVG with it?",
        a: "Yes, an SVG is XML. It will not optimise paths the way a dedicated SVG tool does, but it removes the formatting whitespace safely.",
      },
    ],
    related: ["xml-formatter", "html-minifier", "json-minifier", "css-minifier"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------------ HTML */
  {
    slug: "html-formatter",
    name: "HTML Formatter",
    tagline: "Properly indented HTML, courtesy of Prettier.",
    description:
      "Reformat HTML using Prettier's own HTML parser, so tags, attributes and inline elements are wrapped and indented the way a real code formatter would do it.",
    category: "developer",
    icon: "file-code",
    keywords: ["html formatter", "html beautifier", "format html", "pretty print html", "indent html", "tidy html"],
    seoTitle: "HTML Formatter — Beautify HTML With Prettier, In-Browser",
    seoDescription:
      "Reformat HTML with Prettier's own parser: correct indentation, sensible wrapping and untouched content. Nothing is uploaded — it runs in your browser.",
    faq: [
      {
        q: "Which formatter does this use?",
        a: "Prettier, running as WebAssembly-free JavaScript inside your browser. The output matches what Prettier would produce on your own machine.",
      },
      {
        q: "Why is the first run slower?",
        a: "The formatter is a large library, so it is only downloaded when you open this page and only once per visit. Every run after that is instant.",
      },
      {
        q: "Will it change how my page renders?",
        a: "No. Prettier only changes whitespace outside of elements where whitespace matters, so pre, textarea and script blocks are left exactly as they were.",
      },
    ],
    related: ["html-minifier", "css-formatter", "javascript-formatter", "xml-formatter"],
    privateByDefault: true,
  },
  {
    slug: "html-minifier",
    name: "HTML Minifier",
    tagline: "Strip comments and whitespace from a page.",
    description:
      "Shrink an HTML document by removing comments and the whitespace between tags, while leaving pre, textarea, script and style blocks exactly as they are.",
    category: "developer",
    icon: "minimize-2",
    keywords: ["html minifier", "minify html", "compress html", "strip html comments", "reduce page size"],
    seoTitle: "HTML Minifier — Compress HTML and Remove Comments",
    seoDescription:
      "Minify HTML by removing comments and inter-tag whitespace, with pre, textarea, script and style content preserved. Free and browser-based.",
    faq: [
      {
        q: "Is it safe to remove whitespace between tags?",
        a: "Usually, but not always — whitespace between inline elements is rendered. Check the result before shipping it, especially around spans and links.",
      },
      {
        q: "Why are script and style blocks left alone?",
        a: "Because their contents are code, not markup. Use the JavaScript and CSS minifiers for those, which understand the syntax properly.",
      },
    ],
    related: ["html-formatter", "css-minifier", "javascript-minifier", "xml-minifier"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------------- CSS */
  {
    slug: "css-formatter",
    name: "CSS Formatter",
    tagline: "Readable, consistently indented stylesheets.",
    description:
      "Format CSS with Prettier so every rule, media query and nested block is laid out consistently, with a clear error when the stylesheet will not parse.",
    category: "developer",
    icon: "paintbrush",
    keywords: ["css formatter", "css beautifier", "format css", "pretty print css", "indent css", "tidy css"],
    seoTitle: "CSS Formatter — Beautify Stylesheets With Prettier",
    seoDescription:
      "Format CSS with Prettier: consistent indentation, one declaration per line and tidy media queries. Runs entirely in your browser, nothing uploaded.",
    faq: [
      {
        q: "Does it work with SCSS or Less?",
        a: "The CSS parser handles standard CSS including nesting and custom properties. Preprocessor-only syntax such as mixins may not format cleanly.",
      },
      {
        q: "Will it reorder my declarations?",
        a: "No. Prettier changes formatting only — the order of your rules and declarations, and therefore the cascade, is untouched.",
      },
    ],
    related: ["css-minifier", "html-formatter", "javascript-formatter", "html-minifier"],
    privateByDefault: true,
  },
  {
    slug: "css-minifier",
    name: "CSS Minifier",
    tagline: "Cut a stylesheet down to its smallest safe form.",
    description:
      "Remove comments, whitespace and redundant semicolons from CSS, with strings and url() values copied through byte for byte so nothing inside them changes.",
    category: "developer",
    icon: "minimize-2",
    keywords: ["css minifier", "minify css", "compress css", "css compressor", "reduce css size"],
    seoTitle: "CSS Minifier — Compress Stylesheets Safely Online",
    seoDescription:
      "Minify CSS by stripping comments, whitespace and trailing semicolons, leaving strings and url() values untouched. Free and processed in your browser.",
    faq: [
      {
        q: "Could minifying break my styles?",
        a: "The minifier only removes whitespace that carries no meaning, and copies quoted strings through untouched. It does not merge or reorder rules.",
      },
      {
        q: "How much will it save?",
        a: "A typical hand-written stylesheet shrinks 20–35%. The exact before and after byte counts are shown with every run.",
      },
    ],
    related: ["css-formatter", "javascript-minifier", "html-minifier", "json-minifier"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------ JavaScript */
  {
    slug: "javascript-formatter",
    name: "JavaScript Formatter",
    tagline: "Prettier-formatted JavaScript, in the browser.",
    description:
      "Reformat JavaScript with Prettier — your choice of line width, indent size, semicolons and quote style — and get the parser's own error when the code will not parse.",
    category: "developer",
    icon: "code",
    keywords: [
      "javascript formatter", "js beautifier", "format javascript", "prettier online",
      "pretty print js", "unminify javascript",
    ],
    seoTitle: "JavaScript Formatter — Beautify JS With Prettier Online",
    seoDescription:
      "Format JavaScript with Prettier: choose line width, indent, semicolons and quote style. Great for unminifying code. Runs entirely in your browser.",
    faq: [
      {
        q: "Can I use it to read minified code?",
        a: "Yes. Formatting minified JavaScript restores the line breaks and indentation, which makes it readable — though shortened variable names stay short.",
      },
      {
        q: "Does it support modern syntax?",
        a: "Yes. It uses Prettier's Babel parser, which handles modern JavaScript and JSX. TypeScript-only syntax such as type annotations is not supported here.",
      },
      {
        q: "Is my code sent to a server?",
        a: "No. Prettier is downloaded to your browser and runs there. Proprietary code never leaves the device, which is the main reason this tool exists.",
      },
    ],
    related: ["javascript-minifier", "json-formatter", "css-formatter", "html-formatter"],
    privateByDefault: true,
  },
  {
    slug: "javascript-minifier",
    name: "JavaScript Minifier",
    tagline: "Real minification with Terser — mangle and compress.",
    description:
      "Minify JavaScript with Terser: dead code removed, expressions simplified and local variables renamed. It parses your code rather than just squeezing the text.",
    category: "developer",
    icon: "minimize-2",
    keywords: [
      "javascript minifier", "minify js", "compress javascript", "terser online",
      "uglify javascript", "reduce bundle size",
    ],
    seoTitle: "JavaScript Minifier — Compress JS With Terser Online",
    seoDescription:
      "Minify JavaScript with Terser: remove dead code, simplify expressions and shorten variable names. Free, accurate and processed in your own browser.",
    faq: [
      {
        q: "How is this different from stripping whitespace?",
        a: "Terser builds a syntax tree, so it can safely rename variables and remove unreachable code. A text-based stripper can only delete spaces and comments.",
      },
      {
        q: "Will the minified code behave identically?",
        a: "Yes for ordinary code. The one thing to watch is anything that depends on function or variable names at runtime — turn off mangling if you rely on those.",
      },
      {
        q: "Does it produce a source map?",
        a: "Not here. This tool is for quickly shrinking a snippet; a build pipeline is the right place to generate and publish source maps.",
      },
    ],
    related: ["javascript-formatter", "css-minifier", "html-minifier", "json-minifier"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------------- SQL */
  {
    slug: "sql-formatter",
    name: "SQL Formatter",
    tagline: "Readable SQL with clauses on their own lines.",
    description:
      "Format a query so each clause starts a new line, conditions are indented under WHERE, and keywords are consistently cased — with strings and comments untouched.",
    category: "developer",
    icon: "database",
    keywords: [
      "sql formatter", "sql beautifier", "format sql", "pretty print sql",
      "sql indent", "query formatter",
    ],
    seoTitle: "SQL Formatter — Make Any Query Readable Online",
    seoDescription:
      "Format SQL so clauses start new lines and conditions indent under WHERE, with keyword casing applied and strings left alone. Runs in your browser.",
    faq: [
      {
        q: "Which dialects does it handle?",
        a: "The formatting is dialect-agnostic: it works on clause keywords, brackets and commas, so PostgreSQL, MySQL, SQL Server and SQLite all come out readable.",
      },
      {
        q: "Will it change anything inside my strings?",
        a: "No. Quoted strings, back-tick identifiers and comments are recognised by the tokeniser and copied through exactly, including doubled quote escapes.",
      },
      {
        q: "Does it check my query for errors?",
        a: "No — it formats rather than validates. A query with a syntax error will still be laid out, which often makes the mistake easier to spot.",
      },
    ],
    related: ["json-formatter", "text-diff-checker", "javascript-formatter", "css-formatter"],
    privateByDefault: true,
  },

  /* -------------------------------------------------------------- encoding */
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder & Decoder",
    tagline: "Encode or decode Base64, including the URL-safe form.",
    description:
      "Convert text to Base64 and back, with the URL-safe alphabet and MIME line wrapping available. Unicode is handled correctly in both directions.",
    category: "developer",
    icon: "binary",
    keywords: [
      "base64", "base64 encode", "base64 decode", "base64 converter",
      "url safe base64", "decode base64 string",
    ],
    seoTitle: "Base64 Encoder & Decoder — Convert Text Both Ways",
    seoDescription:
      "Encode text to Base64 or decode it back, with URL-safe output and MIME line wrapping. Unicode-safe and processed entirely in your browser.",
    faq: [
      {
        q: "Is Base64 encryption?",
        a: "No. It is an encoding that anyone can reverse in a second, including with this page. Never use it to protect a password or an API key.",
      },
      {
        q: "What is URL-safe Base64?",
        a: "The same encoding with + and / swapped for - and _, and the padding dropped, so the result can sit safely in a URL or a filename. JWTs use it.",
      },
      {
        q: "Why is my encoded string longer than the original?",
        a: "Base64 represents three bytes as four characters, so everything grows by about a third. It is an encoding, not compression.",
      },
    ],
    related: ["url-encoder-decoder", "jwt-decoder", "hash-generator", "html-entity-encoder-decoder"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder & Decoder",
    tagline: "Percent-encode a URL, a query value or form data.",
    description:
      "Encode and decode URLs with the right scope for the job — a whole URL, a single query value, or application/x-www-form-urlencoded form data.",
    category: "developer",
    icon: "link",
    keywords: [
      "url encode", "url decode", "percent encoding", "urlencode online",
      "query string encoder", "uri encode",
    ],
    seoTitle: "URL Encoder & Decoder — Percent-Encode Any URL",
    seoDescription:
      "Encode and decode URLs, query values and form data with the correct escaping for each. Free percent-encoding tool that runs in your browser.",
    faq: [
      {
        q: "What is the difference between the three scopes?",
        a: "Component escapes & ? = / # so a value is safe inside a query string. Whole URL leaves those structural characters alone. Form data also turns spaces into +.",
      },
      {
        q: "Why does decoding fail with “URI malformed”?",
        a: "A % that is not followed by two hexadecimal digits cannot be decoded. That usually means the text was encoded twice, or a literal % was never escaped.",
      },
    ],
    related: ["url-parser", "base64-encoder-decoder", "slug-generator", "html-entity-encoder-decoder"],
    privateByDefault: true,
  },
  {
    slug: "url-parser",
    name: "URL Parser",
    tagline: "Break a URL into protocol, host, path and parameters.",
    description:
      "Split any URL into its parts — protocol, host, port, path, query parameters and fragment — using the browser's own parser, with each query parameter listed separately.",
    category: "developer",
    icon: "globe",
    keywords: [
      "url parser", "parse url", "query string parser", "url components",
      "split url", "read utm parameters",
    ],
    seoTitle: "URL Parser — Split Any URL Into Its Parts",
    seoDescription:
      "Break a URL into protocol, host, port, path, query parameters and fragment, with each parameter decoded and listed. Processed in your browser.",
    faq: [
      {
        q: "How does it decode the parameters?",
        a: "With the browser's URLSearchParams, so percent-encoded values and + for spaces are resolved the same way a server would resolve them.",
      },
      {
        q: "Can I use it to read UTM tags?",
        a: "Yes — every utm_ parameter appears in the table with its decoded value, which makes it easy to check a campaign link before you send it.",
      },
    ],
    related: ["url-encoder-decoder", "text-extractor", "base64-encoder-decoder", "regex-tester"],
    privateByDefault: true,
  },
  {
    slug: "html-entity-encoder-decoder",
    name: "HTML Entity Encoder & Decoder",
    tagline: "Escape HTML safely, or turn entities back into text.",
    description:
      "Convert characters to HTML entities — the five that HTML requires, named entities where they exist, or everything as numeric references — and decode them back again.",
    category: "developer",
    icon: "code-xml",
    keywords: [
      "html entity encoder", "html entity decoder", "escape html", "html special characters",
      "ampersand entity", "nbsp", "convert entities",
    ],
    seoTitle: "HTML Entity Encoder & Decoder — Escape HTML Characters",
    seoDescription:
      "Encode characters as HTML entities — minimal, named or numeric — and decode them back to plain text. Free, instant and processed in your browser.",
    faq: [
      {
        q: "Which characters must always be escaped?",
        a: "Ampersand, less-than and greater-than in body text, plus both quote characters inside attribute values. Anything else is a matter of preference.",
      },
      {
        q: "Named entities or numeric ones?",
        a: "Named entities read better in source. Numeric references work everywhere without the browser needing to know the name, which suits email templates.",
      },
      {
        q: "Does escaping make my page safe from XSS?",
        a: "Escaping output is a necessary part of it, but real protection also depends on context — attribute, URL or script — and on doing it server-side, not by hand.",
      },
    ],
    related: ["text-cleaner", "base64-encoder-decoder", "url-encoder-decoder", "html-formatter"],
    privateByDefault: true,
  },

  /* ----------------------------------------------------------- identifiers */
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    tagline: "Version 4 and time-ordered version 7 UUIDs in bulk.",
    description:
      "Generate up to 500 UUIDs at once using your browser's cryptographic random number generator — random v4, time-ordered v7, upper case, with or without hyphens.",
    category: "developer",
    icon: "fingerprint",
    keywords: [
      "uuid generator", "guid generator", "uuid v4", "uuid v7",
      "generate uuid", "random id generator", "unique identifier",
    ],
    seoTitle: "UUID Generator — Bulk v4 and v7 UUIDs, Free",
    seoDescription:
      "Generate v4 or time-ordered v7 UUIDs in bulk with your browser's own cryptographic randomness. Choose case and hyphens. Nothing is sent to a server.",
    faq: [
      {
        q: "Should I use v4 or v7?",
        a: "v4 for general use. v7 when the ids become database keys — its leading timestamp means new rows land at the end of the index instead of scattering through it.",
      },
      {
        q: "Could two UUIDs ever collide?",
        a: "A v4 UUID has 122 random bits. You would need to generate about a billion a second for 85 years to reach a one-in-a-billion chance of a single collision.",
      },
      {
        q: "Are these generated securely?",
        a: "Yes — they come from crypto.getRandomValues, your browser's cryptographic random number generator, on your own device. Nothing is transmitted.",
      },
    ],
    related: ["random-string-generator", "password-generator", "hash-generator", "timestamp-converter"],
    privateByDefault: true,
  },
  {
    slug: "random-string-generator",
    name: "Random String Generator",
    tagline: "API keys, tokens and test data, generated securely.",
    description:
      "Generate random strings of any length from the character sets you choose — or your own alphabet — with the entropy of each string shown in bits.",
    category: "developer",
    icon: "dices",
    keywords: [
      "random string generator", "api key generator", "token generator",
      "random hex", "secure random string", "test data generator",
    ],
    seoTitle: "Random String Generator — Secure Tokens and Keys",
    seoDescription:
      "Generate cryptographically random strings of any length and alphabet, with entropy shown in bits. Created locally in your browser, never transmitted.",
    faq: [
      {
        q: "Are these safe to use as API keys?",
        a: "The randomness is cryptographic, so yes technically. Generate production secrets on the server that will use them rather than pasting one through a browser.",
      },
      {
        q: "How much entropy do I need?",
        a: "128 bits is the usual bar for a secret that must resist offline attack. The tool shows the figure for your settings and colours it accordingly.",
      },
      {
        q: "Can I exclude characters that look alike?",
        a: "Yes — type your own alphabet into the custom field, leaving out 0, O, l and 1 if the string will ever be read aloud or typed by hand.",
      },
    ],
    related: ["uuid-generator", "password-generator", "hash-generator", "lorem-ipsum-generator"],
    privateByDefault: true,
  },

  /* ------------------------------------------------------------ time, hash */
  {
    slug: "timestamp-converter",
    name: "Unix Timestamp Converter",
    tagline: "Unix time to a date, and a date back to Unix time.",
    description:
      "Convert a Unix timestamp into every format you might need — ISO 8601, UTC, your local time and the day of the week — or turn a date back into seconds and milliseconds.",
    category: "developer",
    icon: "clock",
    keywords: [
      "unix timestamp converter", "epoch converter", "timestamp to date",
      "date to timestamp", "epoch time", "milliseconds to date",
    ],
    seoTitle: "Unix Timestamp Converter — Epoch Time to Date, Both Ways",
    seoDescription:
      "Convert Unix timestamps to ISO, UTC and local time, or turn a date back into epoch seconds and milliseconds. Uses your device clock and time zone.",
    faq: [
      {
        q: "Seconds or milliseconds?",
        a: "Unix time is seconds; JavaScript uses milliseconds. The tool detects which you pasted — anything of 11 digits or more is read as milliseconds.",
      },
      {
        q: "Which time zone are the local values in?",
        a: "Your own. The tool reads your device's clock and time zone, and names the zone in the output so there is no ambiguity. Servers normally run on UTC.",
      },
      {
        q: "What date format should I type?",
        a: "2026-01-31, or 2026-01-31 14:30 for a specific time. A bare date and time with no zone is read as local time, which is almost always what is meant.",
      },
    ],
    related: ["cron-expression-helper", "uuid-generator", "jwt-decoder", "hash-generator"],
    privateByDefault: true,
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    tagline: "MD5, SHA-1, SHA-256, SHA-512 and CRC32 at once.",
    description:
      "Produce every common hash of a piece of text in one go — MD5, SHA-1, SHA-256, SHA-384, SHA-512 and CRC32 — computed by your browser's own cryptography engine.",
    category: "developer",
    icon: "shield-check",
    keywords: [
      "hash generator", "md5 generator", "sha256 generator", "sha1 hash",
      "checksum calculator", "crc32", "online hash",
    ],
    seoTitle: "Hash Generator — MD5, SHA-1, SHA-256, SHA-512 & CRC32",
    seoDescription:
      "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 and CRC32 hashes of any text at once. Computed locally in your browser — nothing is uploaded.",
    faq: [
      {
        q: "Which hash should I use?",
        a: "SHA-256 for anything security-related. MD5 and SHA-1 are both broken against deliberate collisions and should only be used for non-security checksums.",
      },
      {
        q: "Can a hash be reversed?",
        a: "Not directly, but common inputs are in public lookup tables. Hashing a password without a salt and a slow algorithm such as bcrypt is not protection.",
      },
      {
        q: "Is my text sent anywhere to be hashed?",
        a: "No. SHA hashes come from the browser's built-in SubtleCrypto, and MD5 and CRC32 are computed in JavaScript on your device. Nothing is transmitted.",
      },
    ],
    related: ["password-generator", "uuid-generator", "base64-encoder-decoder", "random-string-generator"],
    privateByDefault: true,
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    tagline: "Read the header and claims inside a JSON Web Token.",
    description:
      "Decode a JSON Web Token to see its algorithm, claims and expiry, with the timestamps translated into readable dates and an expired token flagged immediately.",
    category: "developer",
    icon: "key-round",
    keywords: [
      "jwt decoder", "decode jwt", "json web token", "jwt viewer",
      "read jwt claims", "jwt expiry",
    ],
    seoTitle: "JWT Decoder — Read JSON Web Token Claims Safely",
    seoDescription:
      "Decode a JSON Web Token's header and payload, with timestamps as dates and expiry checked against your clock. Decoded in your browser, never uploaded.",
    faq: [
      {
        q: "Does it verify the signature?",
        a: "No, and deliberately so — verifying needs the secret or public key, and pasting a signing secret into any web page is a bad idea. This decodes only.",
      },
      {
        q: "Is it safe to paste a real token here?",
        a: "The decoding happens entirely in your browser and nothing is sent anywhere. Even so, treat any live token you paste anywhere as exposed and rotate it.",
      },
      {
        q: "Why can anyone read my token's contents?",
        a: "Because a JWT is signed, not encrypted. The payload is only Base64URL-encoded, so never put anything secret in a claim.",
      },
    ],
    related: ["base64-encoder-decoder", "timestamp-converter", "json-formatter", "hash-generator"],
    privateByDefault: true,
  },

  /* -------------------------------------------------------------- patterns */
  {
    slug: "regex-tester",
    name: "Regex Tester",
    tagline: "Test a pattern with live highlighting and capture groups.",
    description:
      "Write a regular expression and watch every match highlight in your test text as you type, with each match listed alongside its position and captured groups.",
    category: "developer",
    icon: "regex",
    keywords: [
      "regex tester", "regular expression tester", "test regex", "regex online",
      "regex match", "regex debugger", "javascript regex",
    ],
    seoTitle: "Regex Tester — Live Regular Expression Testing Online",
    seoDescription:
      "Test a regular expression against your own text with live highlighting, capture groups and every flag. Runs in your browser using its JavaScript engine.",
    faq: [
      {
        q: "Which regex flavour is this?",
        a: "JavaScript's, because it runs in your browser's own engine. Most patterns are portable, but lookbehind and named group syntax differ between languages.",
      },
      {
        q: "What do the flags mean?",
        a: "g finds every match rather than stopping at the first, i ignores case, m makes ^ and $ match each line, s lets . match newlines, and u enables full Unicode.",
      },
      {
        q: "Why does my pattern match an empty string everywhere?",
        a: "Quantifiers such as * and ? allow a zero-length match. Every position then matches; the tool shows these as ∅ and steps past them rather than looping.",
      },
    ],
    related: ["find-and-replace", "text-extractor", "cron-expression-helper", "javascript-formatter"],
    privateByDefault: true,
  },
  {
    slug: "cron-expression-helper",
    name: "Cron Expression Helper",
    tagline: "Read a cron schedule in plain English, and see it run.",
    description:
      "Turn a cron expression into a sentence you can check, and see the next runs as real dates on your own clock — with ranges, steps, lists and day names all supported.",
    category: "developer",
    icon: "calendar-clock",
    keywords: [
      "cron expression", "crontab generator", "cron parser", "cron schedule",
      "next run time", "cron to english", "crontab guru",
    ],
    seoTitle: "Cron Expression Helper — Explain a Schedule and Preview Runs",
    seoDescription:
      "Translate a cron expression into plain English and preview its next runs as real dates, with ranges, steps, lists and day names supported.",
    faq: [
      {
        q: "What does */15 mean?",
        a: "Every 15 units of that field, counting from zero — so in the minute field it means :00, :15, :30 and :45 of every hour.",
      },
      {
        q: "Why does my job run more often than I expect?",
        a: "Probably because both day fields are set. Traditional cron runs the job when either the day of month or the day of week matches, not only when both do.",
      },
      {
        q: "Are the times shown in my time zone?",
        a: "Yes — they use your device's clock. A server usually runs cron in UTC, so check the offset before trusting the preview for a production schedule.",
      },
    ],
    related: ["timestamp-converter", "regex-tester", "json-formatter", "uuid-generator"],
    privateByDefault: true,
  },
];
