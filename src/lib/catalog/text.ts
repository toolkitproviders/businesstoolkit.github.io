import type { Tool } from "@/lib/tool-types";

/**
 * Text tools.
 *
 * Every one is driven by a definition in `features/text/defs/*` and rendered
 * by the shared text engine, so the copy here is the whole per-tool surface.
 * All of them process text entirely in the browser.
 */
export const textTools: Tool[] = [
  {
    slug: "word-counter",
    name: "Word Counter",
    tagline: "Words, characters, sentences and reading time as you type.",
    description:
      "Count words, characters, sentences, paragraphs and lines in any text, with reading and speaking times worked out at the same time. Nothing you paste leaves your browser.",
    category: "text",
    icon: "type",
    keywords: [
      "word count", "word counter", "count words", "essay word count",
      "character count", "how many words", "text statistics",
    ],
    seoTitle: "Word Counter — Count Words, Characters & Reading Time",
    seoDescription:
      "Free word counter. Count words, characters, sentences and paragraphs instantly, with reading and speaking times. Runs in your browser — nothing is uploaded.",
    faq: [
      {
        q: "How are words counted?",
        a: "A word is any run of characters separated by a space or a line break, which is the same rule Microsoft Word and Google Docs use. Hyphenated words count as one.",
      },
      {
        q: "Is my text sent anywhere?",
        a: "No. The counting happens in JavaScript on your own device. Nothing you paste is uploaded, stored or logged — you can disconnect from the internet and it still works.",
      },
      {
        q: "Where does the reading time come from?",
        a: "Words divided by 238 words per minute, the average adult silent-reading speed for English prose. Speaking time uses 130 words per minute, a comfortable presentation pace.",
      },
    ],
    related: ["character-counter", "reading-time-calculator", "sentence-counter", "word-frequency-counter"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "character-counter",
    name: "Character Counter",
    tagline: "Count characters against X, SMS and SEO limits.",
    description:
      "Count characters with and without spaces, and see how much room you have left against the limits for X posts, SMS messages, page titles and meta descriptions.",
    category: "text",
    icon: "hash",
    keywords: [
      "character count", "character counter", "letter count", "twitter character count",
      "sms character count", "meta description length", "count characters",
    ],
    seoTitle: "Character Counter — Count Characters With Platform Limits",
    seoDescription:
      "Count characters with and without spaces, and check the result against X, SMS, SEO title and meta description limits. Free and entirely browser-based.",
    faq: [
      {
        q: "Do spaces count as characters?",
        a: "On most platforms, yes — X, SMS and meta descriptions all count spaces. This tool shows both totals so you can use whichever one applies.",
      },
      {
        q: "Why is my emoji counted as two characters?",
        a: "Many emoji are stored as two UTF-16 code units, which is what JavaScript and most platforms count. Skin tones and flags can count as more still.",
      },
      {
        q: "What is a safe length for a meta description?",
        a: "Around 150–160 characters. Google truncates by pixel width rather than a hard character count, so keep the important words near the beginning.",
      },
    ],
    related: ["word-counter", "sentence-counter", "reading-time-calculator", "text-cleaner"],
    privateByDefault: true,
  },
  {
    slug: "sentence-counter",
    name: "Sentence Counter",
    tagline: "Count sentences and spot the ones that run too long.",
    description:
      "Count the sentences in a piece of writing, see the average sentence length, and get a table of every sentence with its word count so the long ones are easy to find.",
    category: "text",
    icon: "text-quote",
    keywords: ["sentence counter", "count sentences", "how many sentences", "sentence length", "readability"],
    seoTitle: "Sentence Counter — Count Sentences & Check Their Length",
    seoDescription:
      "Count sentences in any text and see the average length, with every sentence listed alongside its word count. Free, instant and processed in your browser.",
    faq: [
      {
        q: "How does it decide where a sentence ends?",
        a: "At a full stop, question mark, exclamation mark or ellipsis. Abbreviations such as “Ltd.” can occasionally be miscounted, which is a limitation of every automatic counter.",
      },
      {
        q: "What sentence length should I aim for?",
        a: "Around 15–20 words on average reads comfortably. Over 25 is a signal to break some sentences up; the tool warns you when your average crosses that line.",
      },
    ],
    related: ["word-counter", "paragraph-counter", "reading-time-calculator", "text-cleaner"],
    privateByDefault: true,
  },
  {
    slug: "paragraph-counter",
    name: "Paragraph Counter",
    tagline: "Count paragraphs and see how they are balanced.",
    description:
      "Count the paragraphs in a document and see the words and sentences in each one, so you can tell at a glance which blocks are doing too much work.",
    category: "text",
    icon: "pilcrow",
    keywords: ["paragraph counter", "count paragraphs", "how many paragraphs", "paragraph length"],
    seoTitle: "Paragraph Counter — Count Paragraphs and Their Length",
    seoDescription:
      "Count paragraphs in any text and see the words and sentences in each. Free online paragraph counter that runs entirely in your own browser.",
    faq: [
      {
        q: "What counts as a paragraph?",
        a: "A block of text separated from the next by a blank line. Single line breaks inside a block are treated as part of the same paragraph.",
      },
      {
        q: "Why does my text show as one paragraph?",
        a: "Because it has no blank lines in it. Press Enter twice between blocks and the count will update immediately.",
      },
    ],
    related: ["sentence-counter", "word-counter", "remove-extra-spaces", "reading-time-calculator"],
    privateByDefault: true,
  },
  {
    slug: "reading-time-calculator",
    name: "Reading Time Calculator",
    tagline: "How long an article takes to read — or to say out loud.",
    description:
      "Work out how long a piece of writing takes to read silently or deliver as a talk, at whichever pace you choose, and get the “X min read” label for a blog post.",
    category: "text",
    icon: "timer",
    keywords: [
      "reading time", "reading time calculator", "how long to read", "speech length",
      "words per minute", "speaking time", "min read",
    ],
    seoTitle: "Reading Time Calculator — Minutes to Read or Present",
    seoDescription:
      "Work out reading and speaking time for any text at your chosen pace, plus the “X min read” label for a blog post. Free and processed in your browser.",
    faq: [
      {
        q: "What reading speed should I use?",
        a: "238 words per minute is the research-backed average for adults reading English prose silently. Use 300 for a skim-reading audience and 200 for technical material.",
      },
      {
        q: "How long should a five-minute talk be?",
        a: "Around 650 words at a comfortable 130 words per minute. Set the speaking pace and the tool tells you exactly how your script lands.",
      },
    ],
    related: ["word-counter", "sentence-counter", "character-counter", "paragraph-counter"],
    privateByDefault: true,
  },
  {
    slug: "word-frequency-counter",
    name: "Word Frequency Counter",
    tagline: "See which words you use most, and how often.",
    description:
      "Rank every word in a piece of text by how often it appears, with common filler words filtered out, so you can spot repetition or check keyword usage.",
    category: "text",
    icon: "list-ordered",
    keywords: [
      "word frequency", "word frequency counter", "most used words", "keyword density",
      "repeated words", "word cloud data",
    ],
    seoTitle: "Word Frequency Counter — Rank the Words in Your Text",
    seoDescription:
      "Count how often each word appears in your text, filter out common filler words, and export the ranked list. Free and processed entirely in your browser.",
    faq: [
      {
        q: "What are the common words it ignores?",
        a: "Function words such as “the”, “and”, “of” and “is”, which dominate any word count without telling you anything. Untick the option to include them.",
      },
      {
        q: "Can I use this to check keyword density?",
        a: "Yes. The Share column gives each word as a percentage of the words counted, which is the usual definition of keyword density.",
      },
      {
        q: "Can I get the results as a file?",
        a: "Yes — Download saves the ranked list as a tab-separated file that opens straight into Excel, Numbers or Google Sheets.",
      },
    ],
    related: ["word-counter", "text-extractor", "sort-lines", "text-cleaner"],
    privateByDefault: true,
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    tagline: "Title Case, UPPER, snake_case and nine more.",
    description:
      "Convert text between twelve cases — sentence case, Title Case, camelCase, snake_case, kebab-case, CONSTANT_CASE and more — without retyping a word.",
    category: "text",
    icon: "case-sensitive",
    keywords: [
      "case converter", "uppercase", "lowercase", "title case", "sentence case",
      "camelcase", "snake case", "kebab case", "change case",
    ],
    seoTitle: "Case Converter — Title Case, UPPER, camelCase & More",
    seoDescription:
      "Convert text to Title Case, sentence case, UPPER, lower, camelCase, snake_case, kebab-case and more. Free, instant, and entirely browser-based.",
    faq: [
      {
        q: "How is Title Case different from capitalising every word?",
        a: "Title Case leaves short joining words such as “of”, “and” and “the” in lower case unless they start or end the title, which is what style guides ask for.",
      },
      {
        q: "Does it handle camelCase input?",
        a: "Yes. “helloWorldHere” is split back into its words before conversion, so it becomes hello_world_here in snake_case rather than one long token.",
      },
      {
        q: "Will sentence case fix my capital letters mid-sentence?",
        a: "Yes. It lower-cases everything first, then capitalises after each full stop, question mark, exclamation mark and line break, and restores a standalone “I”.",
      },
    ],
    related: ["slug-generator", "text-cleaner", "remove-extra-spaces", "find-and-replace"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "remove-extra-spaces",
    name: "Remove Extra Spaces",
    tagline: "Strip double spaces, stray tabs and blank lines.",
    description:
      "Clean up spacing in text pasted from a PDF, email or website: collapse repeated spaces, trim each line, drop blank lines, or flatten everything onto one line.",
    category: "text",
    icon: "eraser",
    keywords: [
      "remove extra spaces", "remove double spaces", "trim whitespace", "delete blank lines",
      "remove line breaks", "tidy text spacing",
    ],
    seoTitle: "Remove Extra Spaces — Clean Up Messy Text Spacing",
    seoDescription:
      "Collapse double spaces, trim lines, remove blank lines or join text onto a single line. Free whitespace cleaner that runs entirely in your browser.",
    faq: [
      {
        q: "Why does pasted text have double spaces in it?",
        a: "PDFs and word processors often place extra spacing to control layout. It survives the copy and shows up as double spaces, stray tabs and hard line breaks.",
      },
      {
        q: "Can I remove the line breaks too?",
        a: "Yes. “Join everything onto one line” replaces every line break with a single space, which is the usual fix for text copied out of a PDF column.",
      },
    ],
    related: ["text-cleaner", "remove-duplicate-lines", "case-converter", "find-and-replace"],
    privateByDefault: true,
  },
  {
    slug: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    tagline: "Deduplicate a list, or pull out only the repeats.",
    description:
      "Remove repeated lines from a list of emails, SKUs, keywords or URLs — keeping the first or last of each — or flip it around and show only the lines that were duplicated.",
    category: "text",
    icon: "arrow-down-up",
    keywords: [
      "remove duplicate lines", "deduplicate list", "delete duplicates", "unique lines",
      "find duplicates", "dedupe emails",
    ],
    seoTitle: "Remove Duplicate Lines — Deduplicate Any List Online",
    seoDescription:
      "Remove repeated lines from a list, keep only unique entries, or show just the duplicates. Free deduplicator that processes your list in the browser.",
    faq: [
      {
        q: "Does it treat different capitalisation as the same line?",
        a: "By default yes — “Apple” and “apple” are treated as one entry. Tick “Case sensitive” if the difference matters to you.",
      },
      {
        q: "Can I see which lines were duplicated?",
        a: "Yes. Set Keep to “Only the lines that were duplicated” and you get the repeats on their own, which is useful for auditing a mailing list.",
      },
      {
        q: "Is the original order preserved?",
        a: "Yes. Nothing is reordered — lines come back in the order they arrived. Use the Sort Lines tool if you want them ordered as well.",
      },
    ],
    related: ["sort-lines", "text-extractor", "remove-extra-spaces", "word-frequency-counter"],
    privateByDefault: true,
  },
  {
    slug: "sort-lines",
    name: "Sort Lines",
    tagline: "Alphabetical, numeric, by length, or shuffled.",
    description:
      "Sort a list of lines alphabetically, by the number inside them, by length, in reverse, or shuffle them at random — with optional trimming and deduplication.",
    category: "text",
    icon: "shuffle",
    keywords: [
      "sort lines", "alphabetical sort", "sort list", "sort text", "shuffle lines",
      "sort numerically", "order a list",
    ],
    seoTitle: "Sort Lines — Alphabetical, Numeric, Length or Random",
    seoDescription:
      "Sort any list of lines A–Z, by number, by length, in reverse or shuffled, with optional deduplication. Free and processed entirely in your browser.",
    faq: [
      {
        q: "Why does numeric sorting put some lines at the bottom?",
        a: "Lines with no number in them cannot be placed on a number line, so they are grouped alphabetically at the end rather than scattered through the results.",
      },
      {
        q: "Is the shuffle actually random?",
        a: "It uses a Fisher–Yates shuffle seeded from your browser's cryptographic random number generator, so every ordering is equally likely. Press Shuffle again for a new one.",
      },
    ],
    related: ["remove-duplicate-lines", "text-extractor", "remove-extra-spaces", "word-frequency-counter"],
    privateByDefault: true,
  },
  {
    slug: "reverse-text",
    name: "Reverse Text",
    tagline: "Flip characters, words or lines — and spot palindromes.",
    description:
      "Reverse text by character, by word order, by line order, or inside each word. Emoji and accented characters survive intact, and palindromes are flagged automatically.",
    category: "text",
    icon: "replace",
    keywords: ["reverse text", "backwards text", "flip text", "mirror text", "reverse words", "palindrome checker"],
    seoTitle: "Reverse Text — Flip Characters, Words or Lines",
    seoDescription:
      "Reverse text by character, word, line, or within each word. Handles emoji and accents correctly, and tells you when your text is a palindrome.",
    faq: [
      {
        q: "Does it break emoji?",
        a: "No. The text is split by Unicode code point rather than by code unit, so emoji, accented letters and other multi-byte characters come back whole.",
      },
      {
        q: "What counts as a palindrome?",
        a: "The tool ignores spaces, punctuation and capitalisation, so “Never odd or even” is recognised even though it is not literally symmetrical.",
      },
    ],
    related: ["case-converter", "text-cleaner", "find-and-replace", "sort-lines"],
    privateByDefault: true,
  },
  {
    slug: "find-and-replace",
    name: "Find and Replace",
    tagline: "Bulk find and replace, with regex if you need it.",
    description:
      "Replace every occurrence of a word or pattern across a whole document, with options for matching case, whole words only, regular expressions and capture groups.",
    category: "text",
    icon: "search",
    keywords: [
      "find and replace", "replace text", "bulk replace", "search and replace",
      "regex replace", "replace all",
    ],
    seoTitle: "Find and Replace — Bulk Text Replacement Online",
    seoDescription:
      "Find and replace text across a whole document, with case matching, whole-word matching and full regular expression support. Runs entirely in your browser.",
    faq: [
      {
        q: "How do I use capture groups?",
        a: "Tick “regular expression”, wrap part of the pattern in brackets, then use $1, $2 and so on in the replacement. Turning 2026-03-14 into 14/03/2026 takes one line.",
      },
      {
        q: "Why does my full stop match everything?",
        a: "Only in regex mode, where “.” means any character. With regex off, everything you type is matched literally, so a full stop is just a full stop.",
      },
      {
        q: "What does “whole words only” do?",
        a: "It adds word boundaries around your search, so replacing “cat” no longer touches “category”. It applies to plain searches, not to regular expressions.",
      },
    ],
    related: ["regex-tester", "text-cleaner", "case-converter", "remove-extra-spaces"],
    privateByDefault: true,
  },
  {
    slug: "text-cleaner",
    name: "Text Cleaner",
    tagline: "Strip HTML, smart quotes, emoji and stray formatting.",
    description:
      "Turn text copied from a website, PDF or email into clean plain text: strip HTML tags, convert smart quotes and dashes, remove emoji, URLs, accents or anything non-ASCII.",
    category: "text",
    icon: "spell-check",
    keywords: [
      "text cleaner", "strip html", "remove html tags", "plain text converter",
      "remove smart quotes", "remove emoji", "clean text",
    ],
    seoTitle: "Text Cleaner — Strip HTML, Smart Quotes and Emoji",
    seoDescription:
      "Clean text copied from the web or a PDF: strip HTML, fix smart quotes and dashes, remove emoji, URLs, accents or non-ASCII characters. All in your browser.",
    faq: [
      {
        q: "Why do quotes turn into strange characters in my code?",
        a: "Word processors substitute curly “smart” quotes, which most programming languages and some databases reject. The smart-quote option converts them back.",
      },
      {
        q: "Does stripping HTML keep the text inside the tags?",
        a: "Yes. Tags are removed and the visible text is kept, with script and style blocks discarded entirely so their contents do not reappear as text.",
      },
      {
        q: "Is it safe to paste confidential text?",
        a: "The cleaning runs in your browser and nothing is transmitted. As always, treat any device you do not control with the usual care.",
      },
    ],
    related: ["remove-extra-spaces", "html-entity-encoder-decoder", "case-converter", "text-extractor"],
    privateByDefault: true,
  },
  {
    slug: "text-extractor",
    name: "Text Extractor",
    tagline: "Pull emails, URLs, numbers or phones out of any text.",
    description:
      "Scan a block of text and pull out every email address, URL, phone number, hashtag, IP address, date or number, deduplicated and ready to paste into a spreadsheet.",
    category: "text",
    icon: "baseline",
    keywords: [
      "extract emails", "extract urls", "email extractor", "url extractor",
      "extract phone numbers", "scrape text", "pull data from text",
    ],
    seoTitle: "Text Extractor — Pull Emails, URLs and Numbers From Text",
    seoDescription:
      "Extract every email address, URL, phone number, hashtag, IP or date from a block of text, deduplicated and ready to copy. Processed in your browser.",
    faq: [
      {
        q: "What separator should I use?",
        a: "New lines paste cleanly into a spreadsheet column. Commas suit a mail client's To field. Both are available, along with spaces and semicolons.",
      },
      {
        q: "Will it find every phone number?",
        a: "It finds the common international and national formats. Unusual spacing or letters inside a number can be missed, so check the count against what you expected.",
      },
      {
        q: "Is this legal to use on scraped data?",
        a: "The tool just reads text you already have. What you may do with personal data such as email addresses is governed by privacy law where you operate.",
      },
    ],
    related: ["remove-duplicate-lines", "find-and-replace", "text-cleaner", "url-parser"],
    privateByDefault: true,
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    tagline: "Placeholder text by paragraph, sentence, word or list.",
    description:
      "Generate as much lorem ipsum as a mockup needs — paragraphs, sentences, single words or list items — plain or already wrapped in HTML tags.",
    category: "text",
    icon: "book-open",
    keywords: [
      "lorem ipsum", "placeholder text", "dummy text", "filler text",
      "lorem ipsum generator", "sample paragraphs",
    ],
    seoTitle: "Lorem Ipsum Generator — Placeholder Text, Instantly",
    seoDescription:
      "Generate lorem ipsum placeholder text by paragraph, sentence, word or list item, plain or wrapped in HTML. Free, unlimited and generated in your browser.",
    faq: [
      {
        q: "Why use lorem ipsum rather than real words?",
        a: "Because meaningless text stops people reading the copy and lets them judge the layout. It has been used by typesetters for exactly this reason since the 1500s.",
      },
      {
        q: "Can I get it as HTML?",
        a: "Yes. Tick “Wrap in HTML tags” and each paragraph comes back inside a p element, or each list item inside an li within a ul.",
      },
    ],
    related: ["random-string-generator", "business-name-generator", "case-converter", "word-counter"],
    privateByDefault: true,
  },
  {
    slug: "slug-generator",
    name: "Slug Generator",
    tagline: "Turn a headline into a clean, search-friendly URL.",
    description:
      "Convert a title into a tidy URL slug: lower case, accents stripped, punctuation removed and words joined by hyphens, with optional stop-word removal and a length cap.",
    category: "text",
    icon: "link",
    keywords: [
      "slug generator", "url slug", "permalink generator", "seo url",
      "url friendly text", "slugify",
    ],
    seoTitle: "Slug Generator — Turn Any Title Into a Clean URL",
    seoDescription:
      "Turn a headline into a clean URL slug: lower case, accents stripped, hyphen-joined, length-capped. Free slug generator that runs in your browser.",
    faq: [
      {
        q: "Hyphens or underscores?",
        a: "Hyphens. Google treats a hyphen as a word separator and an underscore as a joiner, so “cash-flow” is read as two words and “cash_flow” as one.",
      },
      {
        q: "How long should a slug be?",
        a: "Short enough to read at a glance — three to five meaningful words. The tool warns past about 75 characters, where search results start truncating.",
      },
      {
        q: "Should I remove words like “the” and “of”?",
        a: "Only if the slug reads well without them. Dropping them shortens the URL, but readability matters more than squeezing out a few characters.",
      },
    ],
    related: ["case-converter", "url-encoder-decoder", "text-cleaner", "word-counter"],
    privateByDefault: true,
  },
  {
    slug: "text-diff-checker",
    name: "Text Diff Checker",
    tagline: "Compare two versions and see exactly what changed.",
    description:
      "Paste two versions of a document, contract or configuration file and see added and removed lines highlighted side by side, with a count of what changed.",
    category: "text",
    icon: "git-compare",
    keywords: [
      "diff checker", "compare text", "text comparison", "file diff",
      "find differences", "compare two documents", "what changed",
    ],
    seoTitle: "Text Diff Checker — Compare Two Versions Line by Line",
    seoDescription:
      "Compare two versions of any text and see exactly which lines were added and removed, with optional case and whitespace tolerance. Runs in your browser.",
    faq: [
      {
        q: "How does it decide what changed?",
        a: "It finds the longest sequence of lines the two versions share, then marks everything else as added or removed — the same approach version control systems use.",
      },
      {
        q: "Can I ignore formatting differences?",
        a: "Yes. Tick the whitespace and case options to stop indentation changes or capitalisation from being reported as real edits.",
      },
      {
        q: "Are my documents uploaded?",
        a: "No. Both versions stay in your browser, which is what makes this safe for contracts, configuration files and anything else confidential.",
      },
    ],
    related: ["find-and-replace", "remove-duplicate-lines", "json-formatter", "sort-lines"],
    privateByDefault: true,
  },
];
