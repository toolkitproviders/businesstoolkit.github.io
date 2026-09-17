import type { TextToolDef } from "../types";
import {
  characterCounter,
  paragraphCounter,
  readingTimeCalculator,
  sentenceCounter,
  wordCounter,
  wordFrequencyCounter,
} from "./counters";
import {
  caseConverter,
  findAndReplace,
  loremIpsumGenerator,
  removeDuplicateLines,
  removeExtraSpaces,
  reverseText,
  slugGenerator,
  sortLines,
  textCleaner,
  textExtractor,
} from "./transform";
import {
  base64Tool,
  hashGenerator,
  jsonFormatter,
  jsonMinifier,
  jsonValidator,
  jwtDecoder,
  randomStringGenerator,
  timestampConverter,
  urlEncoder,
  urlParser,
  uuidGenerator,
} from "./dev-data";
import {
  cssFormatter,
  cssMinifier,
  htmlFormatter,
  htmlMinifier,
  javascriptFormatter,
  javascriptMinifier,
  sqlFormatter,
  xmlFormatter,
  xmlMinifier,
} from "./dev-code";
import { cronHelper, diffChecker, htmlEntityTool, regexTester } from "./dev-misc";
import {
  canonicalTagGenerator,
  hreflangTagGenerator,
  keywordDensityChecker,
  metaTagGenerator,
  openGraphGenerator,
  robotsTxtGenerator,
  schemaMarkupGenerator,
  sitemapGenerator,
  twitterCardGenerator,
  utmLinkBuilder,
} from "./seo";
import { csvToJson, csvViewer, jsonToCsv, textFileConverter, textFileViewer } from "./files";
import {
  decisionMaker,
  lotteryNumberGenerator,
  pinGenerator,
  randomNumberGenerator,
  randomPicker,
  secureTokenGenerator,
  usernameGenerator,
} from "./random";
import {
  addSubtractDays,
  ageCalculator,
  dateDifferenceCalculator,
  timeDifferenceCalculator,
  timeZoneConverter,
  workingDaysCalculator,
} from "./datetime";

/**
 * Slug → text-tool definition. The registry test asserts this stays in step
 * with the tool catalog in both directions, so a tool can never be listed
 * without a working implementation behind it.
 */
export const TEXT_TOOL_DEFS: Record<string, TextToolDef> = {
  /* ------------------------------------------------------------- text -- */
  "word-counter": wordCounter,
  "character-counter": characterCounter,
  "sentence-counter": sentenceCounter,
  "paragraph-counter": paragraphCounter,
  "reading-time-calculator": readingTimeCalculator,
  "word-frequency-counter": wordFrequencyCounter,
  "case-converter": caseConverter,
  "remove-extra-spaces": removeExtraSpaces,
  "remove-duplicate-lines": removeDuplicateLines,
  "sort-lines": sortLines,
  "reverse-text": reverseText,
  "find-and-replace": findAndReplace,
  "text-cleaner": textCleaner,
  "text-extractor": textExtractor,
  "lorem-ipsum-generator": loremIpsumGenerator,
  "slug-generator": slugGenerator,
  "text-diff-checker": diffChecker,

  /* -------------------------------------------------------- developer -- */
  "json-formatter": jsonFormatter,
  "json-minifier": jsonMinifier,
  "json-validator": jsonValidator,
  "xml-formatter": xmlFormatter,
  "xml-minifier": xmlMinifier,
  "html-formatter": htmlFormatter,
  "html-minifier": htmlMinifier,
  "css-formatter": cssFormatter,
  "css-minifier": cssMinifier,
  "javascript-formatter": javascriptFormatter,
  "javascript-minifier": javascriptMinifier,
  "sql-formatter": sqlFormatter,
  "base64-encoder-decoder": base64Tool,
  "url-encoder-decoder": urlEncoder,
  "url-parser": urlParser,
  "uuid-generator": uuidGenerator,
  "random-string-generator": randomStringGenerator,
  "timestamp-converter": timestampConverter,
  "hash-generator": hashGenerator,
  "jwt-decoder": jwtDecoder,
  "regex-tester": regexTester,
  "cron-expression-helper": cronHelper,
  "html-entity-encoder-decoder": htmlEntityTool,

  /* -------------------------------------------------------------- SEO -- */
  "meta-tag-generator": metaTagGenerator,
  "open-graph-generator": openGraphGenerator,
  "twitter-card-generator": twitterCardGenerator,
  "robots-txt-generator": robotsTxtGenerator,
  "sitemap-generator": sitemapGenerator,
  "utm-link-builder": utmLinkBuilder,
  "keyword-density-checker": keywordDensityChecker,
  "canonical-tag-generator": canonicalTagGenerator,
  "hreflang-tag-generator": hreflangTagGenerator,
  "schema-markup-generator": schemaMarkupGenerator,

  /* ------------------------------------------------------------ files -- */
  "csv-viewer": csvViewer,
  "csv-to-json": csvToJson,
  "json-to-csv": jsonToCsv,
  "text-file-viewer": textFileViewer,
  "text-file-converter": textFileConverter,

  /* -------------------------------------------------- password & random -- */
  "pin-generator": pinGenerator,
  "random-number-generator": randomNumberGenerator,
  "username-generator": usernameGenerator,
  "secure-token-generator": secureTokenGenerator,
  "lottery-number-generator": lotteryNumberGenerator,

  /* ---------------------------------------------------------- date & time -- */
  "date-difference-calculator": dateDifferenceCalculator,
  "age-calculator": ageCalculator,
  "working-days-calculator": workingDaysCalculator,
  "add-subtract-days": addSubtractDays,
  "time-difference-calculator": timeDifferenceCalculator,
  "time-zone-converter": timeZoneConverter,

  /* -------------------------------------------------------- productivity -- */
  "random-picker": randomPicker,
  "decision-maker": decisionMaker,
};

export const textToolSlugs = Object.keys(TEXT_TOOL_DEFS);
