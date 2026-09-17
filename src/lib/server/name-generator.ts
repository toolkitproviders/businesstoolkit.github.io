import "server-only";

/**
 * Business name generator.
 *
 * A rules engine over curated word lists: invented prefixes and suffixes,
 * descriptive heads, and per-industry tails chosen by matching what the
 * visitor typed. No model and no network call, which is what keeps the tool
 * instant, private and free to run.
 */

export type NameStyle = "modern" | "abstract" | "descriptive" | "classic" | "playful" | "compound";
export type NameLength = "short" | "medium" | "long";

export interface NameRequest {
  industry: string;
  keywords: string[];
  description: string;
  style: NameStyle;
  audience: string;
  location: string;
  length: NameLength;
  count: number;
}

export interface NameSuggestion {
  name: string;
  rationale: string;
}

export interface NameResponse {
  names: NameSuggestion[];
}

/* ------------------------------------------------------------- local engine -- */

const PREFIXES = [
  "Ava", "Nova", "Lumi", "Vera", "Cova", "Zeni", "Orbi", "Kova", "Elva", "Meri",
  "Auri", "Selo", "Naro", "Tavi", "Solu", "Rivo", "Pylo", "Crea", "Veno", "Axio",
];

const SUFFIXES = [
  "ly", "ra", "va", "sy", "io", "ora", "ova", "ify", "eon", "ara",
  "ity", "ora", "wise", "lane", "path", "works", "forge", "craft", "field", "point",
];

const DESCRIPTIVE_HEADS = [
  "Bright", "Clear", "Prime", "True", "Swift", "Solid", "Open", "First", "Core", "Peak",
  "North", "Iron", "Copper", "Cedar", "Harbor", "Summit", "Anchor", "Beacon", "Compass", "Meridian",
];

const DESCRIPTIVE_TAILS: Record<string, string[]> = {
  default: ["Works", "Studio", "Group", "Partners", "Collective", "Labs", "House", "Co", "Company", "Union"],
  tech: ["Systems", "Labs", "Technologies", "Digital", "Stack", "Logic", "Cloud", "Data", "Byte", "Works"],
  retail: ["Market", "Trading", "Supply", "Goods", "Store", "Mercantile", "Provisions", "Depot", "Outfitters", "Emporium"],
  food: ["Kitchen", "Table", "Pantry", "Larder", "Bakehouse", "Provisions", "Roastery", "Eatery", "Harvest", "Grove"],
  health: ["Health", "Wellness", "Clinic", "Care", "Vitality", "Practice", "Therapy", "Remedy", "Balance", "Restore"],
  finance: ["Capital", "Advisors", "Financial", "Wealth", "Ledger", "Treasury", "Equity", "Fund", "Reserve", "Trust"],
  creative: ["Studio", "Creative", "Design", "Atelier", "Workshop", "Press", "Media", "Collective", "Craft", "Gallery"],
  property: ["Properties", "Estates", "Realty", "Homes", "Developments", "Land", "Residences", "Holdings", "Spaces", "Build"],
  education: ["Academy", "Institute", "Learning", "School", "Scholars", "Tutors", "Campus", "Mentor", "Study", "Pathway"],
  services: ["Services", "Solutions", "Support", "Care", "Partners", "Group", "Assist", "Pro", "Team", "Hub"],
};

const PLAYFUL_HEADS = [
  "Happy", "Jolly", "Cheeky", "Bouncy", "Sunny", "Peppy", "Zippy", "Snappy", "Chirpy", "Merry",
];

const PLAYFUL_TAILS = [
  "Panda", "Otter", "Badger", "Puffin", "Hedgehog", "Walrus", "Toucan", "Gecko", "Llama", "Narwhal",
];

const CLASSIC_TAILS = [
  "& Co", "& Sons", "& Partners", "Brothers", "Associates", "Chambers", "Heritage", "Legacy", "Bureau", "Hall",
];

function industryKey(industry: string): string {
  const value = industry.toLowerCase();
  if (/tech|software|saas|app|digital|ai|data|it\b/.test(value)) return "tech";
  if (/retail|shop|store|ecommerce|commerce/.test(value)) return "retail";
  if (/food|restaurant|cafe|catering|bakery|coffee/.test(value)) return "food";
  if (/health|medical|clinic|wellness|fitness|therapy/.test(value)) return "health";
  if (/finance|account|bank|invest|insur|tax/.test(value)) return "finance";
  if (/creative|design|agency|marketing|media|photo|art/.test(value)) return "creative";
  if (/property|real estate|construction|build|architect/.test(value)) return "property";
  if (/educat|school|tutor|course|training|learn/.test(value)) return "education";
  if (/service|consult|clean|repair|logistic|legal/.test(value)) return "services";
  return "default";
}

function capitalise(word: string): string {
  return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word;
}

function pick<T>(items: T[], seen: Set<number>): T {
  // Prefer an unused index so a batch does not repeat the same head twenty times.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const index = Math.floor(Math.random() * items.length);
    if (!seen.has(index)) {
      seen.add(index);
      return items[index];
    }
  }
  return items[Math.floor(Math.random() * items.length)];
}

function generateLocally(request: NameRequest): NameSuggestion[] {
  const key = industryKey(request.industry);
  const tails = DESCRIPTIVE_TAILS[key] ?? DESCRIPTIVE_TAILS.default;
  const keywords = request.keywords.map((k) => k.replace(/[^a-zA-Z]/g, "")).filter(Boolean);

  const suggestions: NameSuggestion[] = [];
  const seenNames = new Set<string>();
  const usedHeads = new Set<number>();
  const usedTails = new Set<number>();

  const targetLength = { short: 9, medium: 14, long: 22 }[request.length];

  let guard = 0;
  while (suggestions.length < request.count && guard < request.count * 30) {
    guard += 1;
    let name = "";
    let rationale = "";

    switch (request.style) {
      case "abstract": {
        const prefix = pick(PREFIXES, usedHeads);
        const suffix = pick(SUFFIXES, usedTails);
        name = `${prefix}${suffix}`;
        rationale = "Invented, abstract and easy to trademark";
        break;
      }
      case "descriptive": {
        const head = keywords.length
          ? capitalise(keywords[Math.floor(Math.random() * keywords.length)])
          : pick(DESCRIPTIVE_HEADS, usedHeads);
        name = `${head} ${pick(tails, usedTails)}`;
        rationale = "Says plainly what the business does";
        break;
      }
      case "classic": {
        const head = keywords.length
          ? capitalise(keywords[Math.floor(Math.random() * keywords.length)])
          : pick(DESCRIPTIVE_HEADS, usedHeads);
        name = `${head} ${pick(CLASSIC_TAILS, usedTails)}`;
        rationale = "Traditional and established in tone";
        break;
      }
      case "playful": {
        name = `${pick(PLAYFUL_HEADS, usedHeads)} ${pick(PLAYFUL_TAILS, usedTails)}`;
        rationale = "Warm, memorable and approachable";
        break;
      }
      case "compound": {
        const first = keywords.length
          ? capitalise(keywords[Math.floor(Math.random() * keywords.length)])
          : pick(DESCRIPTIVE_HEADS, usedHeads);
        const second = pick(tails, usedTails);
        name = `${first}${second}`;
        rationale = "Two words fused into one ownable mark";
        break;
      }
      case "modern":
      default: {
        const base = keywords.length
          ? capitalise(keywords[Math.floor(Math.random() * keywords.length)])
          : pick(PREFIXES, usedHeads);
        const suffix = pick(SUFFIXES, usedTails);
        name = `${base}${suffix}`;
        rationale = "Short, modern and domain-friendly";
        break;
      }
    }

    name = name.replace(/\s+/g, " ").trim();

    // Nudge toward the requested length rather than enforcing it strictly.
    const overshoot = name.length - targetLength;
    if (overshoot > 8 && request.length !== "long") continue;
    if (name.length < 4) continue;

    const dedupeKey = name.toLowerCase();
    if (seenNames.has(dedupeKey)) continue;
    seenNames.add(dedupeKey);
    suggestions.push({ name, rationale });
  }

  return suggestions;
}

/* --------------------------------------------------------------- entrypoint -- */

export async function generateNames(request: NameRequest): Promise<NameResponse> {
  return { names: generateLocally(request) };
}
