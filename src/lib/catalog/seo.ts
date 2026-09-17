import type { Tool } from "@/lib/tool-types";

/**
 * SEO and website tools. Each one generates markup you copy — everything is
 * escaped on the way out and nothing is sent to a server.
 */
export const seoTools: Tool[] = [
  {
    slug: "meta-tag-generator",
    name: "Meta Tag Generator",
    tagline: "Title, description and canonical, previewed as a search result.",
    description:
      "Build the meta tags for a page and see exactly how the title and description will look in a search result, with a warning when either runs too long.",
    category: "seo",
    icon: "tags",
    keywords: [
      "meta tag generator", "meta description generator", "seo tags",
      "title tag", "canonical tag", "html head tags", "serp preview",
    ],
    seoTitle: "Meta Tag Generator — With a Live Search Preview",
    seoDescription:
      "Generate title, description, canonical and robots meta tags, and preview how they appear in Google results. Free and browser-based.",
    faq: [
      {
        q: "How long should a title tag be?",
        a: "Aim for 50–60 characters. Google truncates by pixel width rather than a character count, so front-load the words that matter.",
      },
      {
        q: "Does the meta description affect ranking?",
        a: "Not directly. It is a sales pitch in the search result, so it affects how many people click — which is worth the effort on its own.",
      },
      {
        q: "Why does Google show a different description from mine?",
        a: "Google rewrites descriptions when it thinks a passage from the page answers the query better. A clear, relevant description is still worth writing.",
      },
    ],
    related: ["open-graph-generator", "canonical-tag-generator", "keyword-density-checker", "character-counter"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "open-graph-generator",
    name: "Open Graph Generator",
    tagline: "Control how your links look when shared.",
    description:
      "Generate the Open Graph tags that Facebook, LinkedIn, Slack and WhatsApp read, with an optional Twitter card block and a preview of the resulting share card.",
    category: "seo",
    icon: "share2",
    keywords: [
      "open graph generator", "og tags", "og:image", "social share preview",
      "facebook share tags", "linkedin preview", "link preview generator",
    ],
    seoTitle: "Open Graph Generator — Social Share Tags With Preview",
    seoDescription:
      "Generate og: tags for Facebook, LinkedIn, Slack and WhatsApp, with optional Twitter card tags and a live preview of the share card.",
    faq: [
      {
        q: "What size should the image be?",
        a: "1200 × 630 pixels, under 5 MB. That 1.91:1 ratio fills the large card on every major network without awkward cropping.",
      },
      {
        q: "Why is the old image still showing after I updated it?",
        a: "Networks cache previews aggressively. Facebook's Sharing Debugger and LinkedIn's Post Inspector both have a button to re-scrape the page.",
      },
      {
        q: "Do I need Twitter tags as well?",
        a: "Rarely. X falls back to your Open Graph tags for anything the twitter: tags do not set, so adding just twitter:card is usually enough.",
      },
    ],
    related: ["twitter-card-generator", "meta-tag-generator", "social-media-image-resizer", "canonical-tag-generator"],
    privateByDefault: true,
  },
  {
    slug: "twitter-card-generator",
    name: "Twitter Card Generator",
    tagline: "Summary and large-image cards for X.",
    description:
      "Build the twitter: meta tags for a summary or large-image card, with length warnings and a preview of how the card will appear.",
    category: "seo",
    icon: "share2",
    keywords: [
      "twitter card generator", "x card tags", "twitter:card",
      "summary_large_image", "twitter meta tags", "tweet preview",
    ],
    seoTitle: "Twitter Card Generator — Meta Tags for X Previews",
    seoDescription:
      "Generate twitter: card meta tags for summary and large-image cards, with title and description length checks and a live preview.",
    faq: [
      {
        q: "Which card type should I use?",
        a: "summary_large_image for anything with a decent picture — it takes far more space in the timeline. Use summary when the image is a small logo.",
      },
      {
        q: "Do I still need a Twitter handle?",
        a: "twitter:site attributes the card to your account and twitter:creator to the author. Neither is required, but both help attribution.",
      },
    ],
    related: ["open-graph-generator", "meta-tag-generator", "social-media-image-resizer", "image-resizer"],
    privateByDefault: true,
  },
  {
    slug: "robots-txt-generator",
    name: "Robots.txt Generator",
    tagline: "Block crawlers, allow search engines, add your sitemap.",
    description:
      "Build a robots.txt file from a list of paths, with presets for allowing everything, blocking a staging site, or letting search engines in while keeping AI training crawlers out.",
    category: "seo",
    icon: "bot-off",
    keywords: [
      "robots.txt generator", "robots txt", "block crawlers", "disallow",
      "crawl directives", "block ai crawlers", "gptbot", "seo robots",
    ],
    seoTitle: "Robots.txt Generator — Crawl Rules, Presets and Sitemap",
    seoDescription:
      "Generate a robots.txt with disallow paths, crawl delay and a sitemap line, plus presets for staging sites and blocking AI training crawlers.",
    faq: [
      {
        q: "Where does robots.txt go?",
        a: "At the root of the domain, at https://example.com/robots.txt. A copy in a subfolder is ignored, and each subdomain needs its own.",
      },
      {
        q: "Does Disallow keep a page out of Google?",
        a: "No. It asks crawlers not to fetch the page, but a disallowed URL can still be indexed from external links. Use a noindex meta tag to keep something out of results.",
      },
      {
        q: "How do I block AI training crawlers?",
        a: "The AI preset lists the common ones — GPTBot, ClaudeBot, CCBot, Google-Extended and others — while leaving search engines free to crawl. Compliance is voluntary on their side.",
      },
    ],
    related: ["sitemap-generator", "meta-tag-generator", "canonical-tag-generator", "hreflang-tag-generator"],
    privateByDefault: true,
  },
  {
    slug: "sitemap-generator",
    name: "XML Sitemap Generator",
    tagline: "Turn a list of URLs into a valid sitemap.xml.",
    description:
      "Paste your URLs, one per line, and get a valid XML sitemap with optional change frequency, priority and last-modified dates — duplicates removed automatically.",
    category: "seo",
    icon: "map",
    keywords: [
      "sitemap generator", "xml sitemap", "sitemap.xml", "create sitemap",
      "seo sitemap", "url list to sitemap", "google sitemap",
    ],
    seoTitle: "XML Sitemap Generator — Paste URLs, Get sitemap.xml",
    seoDescription:
      "Turn a list of URLs into a valid XML sitemap with change frequency, priority and lastmod. Duplicates removed. Free and browser-based.",
    faq: [
      {
        q: "How many URLs can one sitemap hold?",
        a: "50,000, or 50 MB uncompressed. Past that, split it into several files and list them in a sitemap index.",
      },
      {
        q: "Do priority and changefreq actually matter?",
        a: "Google has said it largely ignores both. They do no harm, but the URLs themselves and a correct lastmod are what count.",
      },
      {
        q: "What do I do with the file?",
        a: "Save it as sitemap.xml at your site's root, reference it from robots.txt, and submit it in Google Search Console and Bing Webmaster Tools.",
      },
    ],
    related: ["robots-txt-generator", "meta-tag-generator", "canonical-tag-generator", "url-parser"],
    privateByDefault: true,
  },
  {
    slug: "utm-link-builder",
    name: "UTM Link Builder",
    tagline: "Tag a campaign link so analytics can track it.",
    description:
      "Add utm_source, utm_medium, utm_campaign and the rest to any URL, with consistent lower-casing and a warning when a required parameter is missing.",
    category: "seo",
    icon: "link-2",
    keywords: [
      "utm builder", "utm link generator", "campaign url builder",
      "utm parameters", "google analytics tracking link", "utm_source",
    ],
    seoTitle: "UTM Link Builder — Tag Campaign URLs for Analytics",
    seoDescription:
      "Build tagged campaign URLs with utm_source, utm_medium, utm_campaign, term and content, with consistent casing. Free and browser-based.",
    faq: [
      {
        q: "Which parameters are required?",
        a: "Source, medium and campaign. Analytics tools group reports by those three, so a link missing any of them lands in the wrong bucket.",
      },
      {
        q: "Why does casing matter?",
        a: "UTM values are case-sensitive in most analytics tools, so “Email” and “email” appear as two separate sources. Lower-casing everything avoids the split.",
      },
      {
        q: "Should I use UTM tags on internal links?",
        a: "No. Tagging an internal link starts a new session and wipes the original source, which corrupts your attribution.",
      },
    ],
    related: ["url-parser", "url-encoder-decoder", "meta-tag-generator", "qr-code-generator"],
    privateByDefault: true,
  },
  {
    slug: "keyword-density-checker",
    name: "Keyword Density Checker",
    tagline: "See which words and phrases your page leans on.",
    description:
      "Measure how often each word or phrase appears in your copy as a percentage, check a focus keyword, and get a warning when it tips into keyword stuffing.",
    category: "seo",
    icon: "trending-up-down",
    keywords: [
      "keyword density", "keyword density checker", "seo keyword analysis",
      "keyword stuffing", "phrase frequency", "content analysis",
    ],
    seoTitle: "Keyword Density Checker — Words, Phrases and Percentages",
    seoDescription:
      "Check keyword and phrase density in your page copy, track a focus keyword, and get a warning before it reads as keyword stuffing.",
    faq: [
      {
        q: "What density should I aim for?",
        a: "There is no target. Write naturally and check afterwards; anything over about 3% for one phrase starts to read as stuffing to both people and search engines.",
      },
      {
        q: "Why check two and three-word phrases?",
        a: "Because that is how people search. “Invoice generator” tells you far more about what the page is about than “invoice” and “generator” counted separately.",
      },
      {
        q: "Is keyword density still a ranking factor?",
        a: "Not as a number. Search engines moved to semantic relevance years ago. It remains a useful check that you have actually covered your topic.",
      },
    ],
    related: ["word-frequency-counter", "word-counter", "meta-tag-generator", "reading-time-calculator"],
    privateByDefault: true,
  },
  {
    slug: "canonical-tag-generator",
    name: "Canonical Tag Generator",
    tagline: "Tell search engines which URL is the real one.",
    description:
      "Generate the canonical link tag for a page, plus AMP, previous and next links for paginated series and the HTTP header form for non-HTML files.",
    category: "seo",
    icon: "link-2",
    keywords: [
      "canonical tag generator", "rel canonical", "duplicate content",
      "canonical url", "seo canonical", "link rel canonical",
    ],
    seoTitle: "Canonical Tag Generator — Fix Duplicate Content URLs",
    seoDescription:
      "Generate rel=canonical link tags, plus amphtml, prev and next links and the HTTP header form. Free canonical tag builder for your head.",
    faq: [
      {
        q: "When do I need a canonical tag?",
        a: "Whenever the same content is reachable at more than one URL — tracking parameters, trailing slashes, http and https, or a printer-friendly version.",
      },
      {
        q: "Should every page have one pointing at itself?",
        a: "Yes, that is the usual advice. A self-referencing canonical settles parameter and slash variants without you having to enumerate them.",
      },
      {
        q: "Can the canonical be a relative URL?",
        a: "Technically yes, but it is a common and expensive mistake. Always use the absolute URL including the protocol and host.",
      },
    ],
    related: ["meta-tag-generator", "hreflang-tag-generator", "sitemap-generator", "robots-txt-generator"],
    privateByDefault: true,
  },
  {
    slug: "hreflang-tag-generator",
    name: "Hreflang Tag Generator",
    tagline: "Link your language and region variants correctly.",
    description:
      "Paste your language codes and URLs and get the full set of hreflang link tags, including x-default, with a warning on anything that does not look like a valid code.",
    category: "seo",
    icon: "languages",
    keywords: [
      "hreflang generator", "hreflang tags", "international seo",
      "multilingual site seo", "x-default", "language targeting",
    ],
    seoTitle: "Hreflang Tag Generator — Multilingual SEO Link Tags",
    seoDescription:
      "Generate hreflang link tags for every language and region version of a page, including x-default, with code validation. Free and instant.",
    faq: [
      {
        q: "What format do the codes take?",
        a: "A two-letter language code, optionally followed by a region: en, en-GB, pt-BR. The region must be a country code, not a language.",
      },
      {
        q: "Does every page need to list every other?",
        a: "Yes. Hreflang must be bidirectional and include a self-reference. If page A points at B but B does not point back, Google ignores the pair.",
      },
      {
        q: "What is x-default for?",
        a: "The page to show when no language version matches the visitor — typically a global landing page or a language picker.",
      },
    ],
    related: ["canonical-tag-generator", "meta-tag-generator", "sitemap-generator", "robots-txt-generator"],
    privateByDefault: true,
  },
  {
    slug: "schema-markup-generator",
    name: "Schema Markup Generator",
    tagline: "JSON-LD for organisations, products, FAQs and articles.",
    description:
      "Build valid JSON-LD structured data for an Organization, LocalBusiness, Product, FAQ page or Article, ready to paste into your page's head.",
    category: "seo",
    icon: "braces2",
    keywords: [
      "schema markup generator", "json-ld generator", "structured data",
      "rich results", "faq schema", "local business schema", "product schema",
    ],
    seoTitle: "Schema Markup Generator — JSON-LD Structured Data",
    seoDescription:
      "Generate valid JSON-LD for Organization, LocalBusiness, Product, FAQPage and Article, ready to paste into your head. Free and instant.",
    faq: [
      {
        q: "Why JSON-LD rather than microdata?",
        a: "It is Google's recommended format and it sits in one script tag, so you never have to thread attributes through your markup.",
      },
      {
        q: "Will this get me rich results?",
        a: "It makes you eligible; Google decides. Test the output with the Rich Results Test, and make sure the marked-up content is genuinely visible on the page.",
      },
      {
        q: "Can I mark up things the page does not show?",
        a: "No. Describing prices, reviews or FAQs that a visitor cannot see on the page is against Google's guidelines and risks a manual penalty.",
      },
    ],
    related: ["meta-tag-generator", "open-graph-generator", "json-formatter", "canonical-tag-generator"],
    privateByDefault: true,
  },
];
