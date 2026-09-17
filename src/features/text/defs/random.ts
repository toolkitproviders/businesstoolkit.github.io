import { randomInt, shuffle } from "@/lib/random";
import type { TextResult, TextToolDef } from "../types";

/**
 * Random generators.
 *
 * Every value comes from `crypto.getRandomValues` through the shared helper in
 * `lib/random.ts`, which rejects the tail of the range so the modulo does not
 * quietly favour low numbers. All of these are marked `deferred`: the server's
 * dice roll would never match the browser's.
 */

const n = (value: number) => value.toLocaleString("en-US");

/** log2 of the number of equally likely results, which is what entropy means. */
function entropyLabel(bits: number): { value: string; tone: TextResult["stats"] extends undefined ? never : "success" | "accent" | "warning" | "error" } {
  return {
    value: `${bits.toFixed(1)} bits`,
    tone: bits >= 128 ? "success" : bits >= 64 ? "accent" : bits >= 40 ? "warning" : "error",
  };
}

/* -------------------------------------------------------------------- PIN -- */

export const pinGenerator: TextToolDef = {
  controlsTitle: "Options",
  deferred: true,
  generate: { label: "Generate new PINs" },
  options: [
    { key: "length", label: "Digits", type: "number", initial: "6", min: 3, max: 16 },
    { key: "count", label: "How many", type: "number", initial: "10", min: 1, max: 200 },
    { key: "noRepeat", label: "No repeated digits", type: "checkbox", initial: "", wide: true },
    { key: "noSequence", label: "No runs like 1234 or 9876", type: "checkbox", initial: "1", wide: true },
    { key: "noCommon", label: "Avoid the most-guessed PINs", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (_input, _v, h) => {
    const length = Math.min(16, Math.max(3, h.num("length", 6)));
    const count = Math.min(200, Math.max(1, h.num("count", 10)));

    // The PINs that turn up again and again in breach data.
    const COMMON = new Set([
      "1234", "1111", "0000", "1212", "7777", "1004", "2000", "4444", "2222", "6969",
      "9999", "3333", "5555", "6666", "1122", "1313", "8888", "4321", "2001", "1010",
      "123456", "111111", "000000", "121212", "654321", "123123", "666666", "112233",
    ]);

    const hasRun = (pin: string) => {
      for (let i = 0; i + 2 < pin.length; i++) {
        const a = Number(pin[i]);
        const b = Number(pin[i + 1]);
        const c = Number(pin[i + 2]);
        if (b - a === c - b && Math.abs(b - a) === 1) return true;
      }
      return false;
    };

    const makeOne = (): string => {
      if (h.bool("noRepeat")) {
        if (length > 10) return "";
        return shuffle("0123456789".split("")).slice(0, length).join("");
      }
      let pin = "";
      for (let i = 0; i < length; i++) pin += randomInt(10);
      return pin;
    };

    if (h.bool("noRepeat") && length > 10) {
      return { error: "A PIN with no repeated digits can be at most 10 digits long — there are only ten digits." };
    }

    const pins: string[] = [];
    let rejected = 0;
    // Bounded so an impossible combination of rules cannot spin forever.
    for (let attempt = 0; pins.length < count && attempt < count * 400; attempt++) {
      const pin = makeOne();
      if (!pin) continue;
      if (h.bool("noCommon") && COMMON.has(pin)) {
        rejected++;
        continue;
      }
      if (h.bool("noSequence") && hasRun(pin)) {
        rejected++;
        continue;
      }
      if (new Set(pin).size === 1) {
        rejected++;
        continue;
      }
      pins.push(pin);
    }

    if (pins.length === 0) {
      return { error: "Those rules rule out every PIN of that length. Loosen one of them." };
    }

    const bits = Math.log2(10 ** length);
    return {
      output: pins.join("\n"),
      filename: "pins.txt",
      stats: [
        { label: "Generated", value: n(pins.length), tone: "accent" },
        { label: "Combinations", value: n(10 ** length) },
        { label: "Entropy each", ...entropyLabel(bits) },
      ],
      note:
        rejected > 0
          ? `${n(rejected)} candidate${rejected === 1 ? " was" : "s were"} discarded for matching a rule you turned on.`
          : undefined,
      warning:
        length <= 4
          ? "A four-digit PIN has only 10,000 combinations. It is fine for a card with lockout after three tries, and useless for anything else."
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "PINs", mono: true, rows: 12 },
  privacyNote:
    "Every PIN is generated locally in your browser using its cryptographic random number generator. Nothing is sent to a server.",
  notes: [
    { label: "Combinations", formula: "10 ^ digits", note: "Four digits give 10,000; six give a million." },
    { label: "Why avoid runs", formula: "1234 and 1111 are guessed first", note: "A handful of PINs cover a large share of real-world choices." },
  ],
};

/* ---------------------------------------------------------- random number -- */

export const randomNumberGenerator: TextToolDef = {
  controlsTitle: "Range",
  deferred: true,
  generate: { label: "Generate again" },
  options: [
    { key: "min", label: "Minimum", type: "number", initial: "1" },
    { key: "max", label: "Maximum", type: "number", initial: "100" },
    { key: "count", label: "How many", type: "number", initial: "5", min: 1, max: 1000 },
    { key: "decimals", label: "Decimal places", type: "number", initial: "0", min: 0, max: 8 },
    { key: "unique", label: "No repeats", type: "checkbox", initial: "", wide: true },
    { key: "sort", label: "Sort the results", type: "checkbox", initial: "", wide: true },
    {
      key: "separator",
      label: "Separate with",
      type: "select",
      initial: "newline",
      options: [
        { value: "newline", label: "A new line" },
        { value: "comma-space", label: "Comma and space" },
        { value: "space", label: "Space" },
      ],
    },
  ],
  transform: (_input, _v, h) => {
    let min = h.num("min", 1);
    let max = h.num("max", 100);
    if (min > max) [min, max] = [max, min];

    const decimals = Math.min(8, Math.max(0, Math.round(h.num("decimals", 0))));
    const count = Math.min(1000, Math.max(1, h.num("count", 5)));
    const unique = h.bool("unique");

    // Work in integer steps so the decimal case is drawn as uniformly as the
    // whole-number one, rather than by scaling a float.
    const step = 10 ** decimals;
    const low = Math.round(min * step);
    const high = Math.round(max * step);
    const span = high - low + 1;

    if (span <= 0) return { error: "That range is empty." };
    if (unique && span < count) {
      return {
        error: `You asked for ${n(count)} different numbers, but the range ${min}–${max} only holds ${n(span)}.`,
      };
    }

    const values: number[] = [];
    const seen = new Set<number>();
    for (let i = 0; values.length < count && i < count * 1000; i++) {
      const raw = low + randomInt(span);
      if (unique) {
        if (seen.has(raw)) continue;
        seen.add(raw);
      }
      values.push(raw / step);
    }

    const ordered = h.bool("sort") ? [...values].sort((a, b) => a - b) : values;
    const rendered = ordered.map((v) => v.toFixed(decimals));
    const separator = { newline: "\n", "comma-space": ", ", space: " " }[h.str("separator")] ?? "\n";

    const total = ordered.reduce((sum, v) => sum + v, 0);
    return {
      output: rendered.join(separator),
      filename: "random-numbers.txt",
      stats: [
        { label: "Generated", value: n(ordered.length), tone: "accent" },
        { label: "Range size", value: n(span) },
        { label: "Average", value: (total / ordered.length).toFixed(Math.max(2, decimals)) },
      ],
      note: `Each value is drawn uniformly from ${min} to ${max} inclusive, using your browser's cryptographic random number generator.`,
    } satisfies TextResult;
  },
  output: { label: "Numbers", mono: true, rows: 10 },
  privacyNote: "Generated locally in your browser. Nothing is sent to a server.",
};

/* -------------------------------------------------------------- username -- */

const ADJECTIVES =
  "swift quiet brave clever amber cobalt crimson golden silver rapid solar lunar northern coastal quantum electric mellow rustic urban wild cosmic velvet gentle steady bold candid nimble stellar vivid dusky frosty hidden radiant".split(
    " ",
  );
const NOUNS =
  "otter falcon harbour lantern compass anchor ember willow canyon summit meadow beacon orchard cascade thistle badger heron juniper marble quarry raven sparrow tundra vessel warden birch cinder driftwood fjord glacier".split(
    " ",
  );

export const usernameGenerator: TextToolDef = {
  controlsTitle: "Style",
  deferred: true,
  generate: { label: "Generate new usernames" },
  options: [
    {
      key: "style",
      label: "Pattern",
      type: "select",
      initial: "adjective-noun",
      wide: true,
      options: [
        { value: "adjective-noun", label: "adjective + noun — swiftotter" },
        { value: "adjective-noun-number", label: "adjective + noun + number — swiftotter42" },
        { value: "noun-number", label: "noun + number — otter2481" },
        { value: "initials", label: "From your own words below" },
      ],
    },
    { key: "words", label: "Your words", type: "text", placeholder: "Ada Lovelace", wide: true, when: (v) => v.style === "initials" },
    {
      key: "separator",
      label: "Join words with",
      type: "select",
      initial: "",
      options: [
        { value: "", label: "Nothing" },
        { value: "_", label: "Underscore" },
        { value: "-", label: "Hyphen" },
        { value: ".", label: "Full stop" },
      ],
    },
    { key: "count", label: "How many", type: "number", initial: "12", min: 1, max: 100 },
    { key: "capitalise", label: "Capitalise each word", type: "checkbox", initial: "", wide: true },
    { key: "maxLength", label: "Maximum length", type: "number", initial: "20", min: 3, max: 40 },
  ],
  transform: (_input, _v, h) => {
    const style = h.str("style") || "adjective-noun";
    const separator = h.str("separator");
    const count = Math.min(100, Math.max(1, h.num("count", 12)));
    const maxLength = Math.max(3, h.num("maxLength", 20));

    const cap = (word: string) => (h.bool("capitalise") ? word[0].toUpperCase() + word.slice(1) : word);
    const pick = (list: string[]) => list[randomInt(list.length)];

    const ownWords = h
      .str("words")
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map((w) => w.toLowerCase());

    const makeOne = (): string => {
      if (style === "initials") {
        if (ownWords.length === 0) return "";
        const base = ownWords.map(cap).join(separator);
        return `${base}${separator}${randomInt(9000) + 1000}`;
      }
      if (style === "noun-number") return `${cap(pick(NOUNS))}${separator}${randomInt(9000) + 1000}`;
      if (style === "adjective-noun-number") {
        return `${cap(pick(ADJECTIVES))}${separator}${cap(pick(NOUNS))}${separator}${randomInt(90) + 10}`;
      }
      return `${cap(pick(ADJECTIVES))}${separator}${cap(pick(NOUNS))}`;
    };

    if (style === "initials" && ownWords.length === 0) {
      return { note: "Type a name or a couple of words above and the usernames will be built from them." };
    }

    const names = new Set<string>();
    for (let attempt = 0; names.size < count && attempt < count * 200; attempt++) {
      const name = makeOne();
      if (name && name.length <= maxLength) names.add(name);
    }

    const list = [...names];
    if (list.length === 0) {
      return { error: "Nothing fits that maximum length. Raise it, or pick a shorter pattern." };
    }

    return {
      output: list.join("\n"),
      filename: "usernames.txt",
      stats: [
        { label: "Generated", value: n(list.length), tone: "accent" },
        { label: "Shortest", value: `${Math.min(...list.map((s) => s.length))} chars` },
        { label: "Longest", value: `${Math.max(...list.map((s) => s.length))} chars` },
      ],
      note: "These are suggestions, not reservations — check the name is free on the service you want it for.",
      warning:
        list.length < count
          ? `Only ${n(list.length)} distinct names fit within ${maxLength} characters. Raise the limit for more.`
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "Usernames", mono: true, rows: 12 },
  privacyNote: "Generated in your browser. The words you type are not sent anywhere.",
};

/* ------------------------------------------------------------ secure token -- */

const TOKEN_ALPHABETS = {
  hex: "0123456789abcdef",
  base62: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  base64url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  // Crockford base32: no I, L, O or U, so nothing is misread when typed out.
  base32: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
};

export const secureTokenGenerator: TextToolDef = {
  controlsTitle: "Token",
  deferred: true,
  generate: { label: "Generate new tokens" },
  options: [
    {
      key: "alphabet",
      label: "Alphabet",
      type: "select",
      initial: "base62",
      wide: true,
      options: [
        { value: "base62", label: "Base62 — letters and digits, URL-safe" },
        { value: "base64url", label: "Base64URL — adds - and _" },
        { value: "hex", label: "Hexadecimal — 0–9 and a–f" },
        { value: "base32", label: "Crockford Base32 — no look-alike characters" },
      ],
    },
    {
      key: "bits",
      label: "Strength",
      type: "select",
      initial: "256",
      wide: true,
      options: [
        { value: "128", label: "128 bits — session tokens" },
        { value: "192", label: "192 bits" },
        { value: "256", label: "256 bits — API keys and signing secrets" },
        { value: "512", label: "512 bits — long-lived secrets" },
      ],
    },
    { key: "prefix", label: "Prefix", type: "text", placeholder: "sk_live_", wide: true, hint: "Makes a leaked key identifiable in logs and scanners." },
    { key: "count", label: "How many", type: "number", initial: "3", min: 1, max: 50 },
    { key: "groups", label: "Break into groups of four", type: "checkbox", initial: "", wide: true },
  ],
  transform: (_input, _v, h) => {
    const key = (h.str("alphabet") || "base62") as keyof typeof TOKEN_ALPHABETS;
    const alphabet = TOKEN_ALPHABETS[key] ?? TOKEN_ALPHABETS.base62;
    const targetBits = Math.max(64, h.num("bits", 256));
    const perChar = Math.log2(alphabet.length);
    const length = Math.ceil(targetBits / perChar);
    const count = Math.min(50, Math.max(1, h.num("count", 3)));
    // A prefix is a label, not a secret, so strip anything that would break a
    // header or a URL rather than carrying it through.
    const prefix = h.str("prefix").replace(/[^\w.:-]/gu, "");

    const tokens = Array.from({ length: count }, () => {
      let body = "";
      for (let i = 0; i < length; i++) body += alphabet[randomInt(alphabet.length)];
      if (h.bool("groups")) body = (body.match(/.{1,4}/gu) ?? []).join("-");
      return `${prefix}${body}`;
    });

    const actualBits = perChar * length;
    return {
      output: tokens.join("\n"),
      filename: "tokens.txt",
      stats: [
        { label: "Entropy each", ...entropyLabel(actualBits) },
        { label: "Characters", value: String(length + prefix.length) },
        { label: "Alphabet size", value: String(alphabet.length) },
      ],
      note: `Each token is ${length} characters from a ${alphabet.length}-character alphabet, which is ${actualBits.toFixed(1)} bits of entropy.`,
      warning:
        "Generate production secrets on the server that will use them. A secret that has been through a browser, an editor or a chat window should be treated as exposed.",
    } satisfies TextResult;
  },
  output: { label: "Tokens", mono: true, rows: 10 },
  privacyNote:
    "Tokens are generated locally using your browser's cryptographic random number generator and are never transmitted. Even so, treat anything generated here as needing rotation before real use.",
  notes: [
    { label: "128 bits", formula: "The usual bar for a session token" },
    { label: "256 bits", formula: "Standard for API keys and signing secrets" },
    { label: "Prefixes", formula: "sk_live_, ghp_, xoxb-", note: "Secret scanners match on them, so a leaked key gets caught faster." },
  ],
};

/* --------------------------------------------------------------- lottery -- */

const LOTTERIES: Record<string, { label: string; main: number; pool: number; bonus?: number; bonusPool?: number }> = {
  custom: { label: "Custom", main: 6, pool: 49 },
  uk: { label: "UK Lotto — 6 from 59", main: 6, pool: 59 },
  euro: { label: "EuroMillions — 5 from 50 plus 2 Lucky Stars from 12", main: 5, pool: 50, bonus: 2, bonusPool: 12 },
  powerball: { label: "Powerball — 5 from 69 plus 1 from 26", main: 5, pool: 69, bonus: 1, bonusPool: 26 },
  mega: { label: "Mega Millions — 5 from 70 plus 1 from 25", main: 5, pool: 70, bonus: 1, bonusPool: 25 },
};

/** n choose k, computed multiplicatively so it stays exact for lottery sizes. */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

function drawWithoutReplacement(pool: number, take: number): number[] {
  const numbers = Array.from({ length: pool }, (_v, i) => i + 1);
  // Partial Fisher-Yates: shuffle only as far as we need to draw.
  for (let i = 0; i < take; i++) {
    const j = i + randomInt(pool - i);
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers.slice(0, take).sort((a, b) => a - b);
}

export const lotteryNumberGenerator: TextToolDef = {
  controlsTitle: "Draw",
  deferred: true,
  generate: { label: "Draw again" },
  options: [
    {
      key: "game",
      label: "Game",
      type: "select",
      initial: "uk",
      wide: true,
      options: Object.entries(LOTTERIES).map(([value, g]) => ({ value, label: g.label })),
    },
    { key: "main", label: "Numbers to draw", type: "number", initial: "6", min: 1, max: 20, when: (v) => v.game === "custom" },
    { key: "pool", label: "From 1 to", type: "number", initial: "49", min: 2, max: 100, when: (v) => v.game === "custom" },
    { key: "lines", label: "Lines", type: "number", initial: "5", min: 1, max: 50 },
  ],
  transform: (_input, _v, h) => {
    const game = LOTTERIES[h.str("game")] ?? LOTTERIES.uk;
    const main = h.str("game") === "custom" ? Math.max(1, h.num("main", 6)) : game.main;
    const pool = h.str("game") === "custom" ? Math.max(2, h.num("pool", 49)) : game.pool;

    if (main > pool) {
      return { error: `You cannot draw ${main} different numbers from a pool of ${pool}.` };
    }

    const lines = Math.min(50, Math.max(1, h.num("lines", 5)));
    const rows: string[][] = [];
    const rendered: string[] = [];

    for (let i = 0; i < lines; i++) {
      const numbers = drawWithoutReplacement(pool, main);
      const bonus = game.bonus && game.bonusPool ? drawWithoutReplacement(game.bonusPool, game.bonus) : [];
      rows.push([
        String(i + 1),
        numbers.join("  "),
        bonus.length ? bonus.join("  ") : "—",
      ]);
      rendered.push(bonus.length ? `${numbers.join(" ")}  +  ${bonus.join(" ")}` : numbers.join(" "));
    }

    const odds = combinations(pool, main) * (game.bonus && game.bonusPool ? combinations(game.bonusPool, game.bonus) : 1);

    return {
      output: rendered.join("\n"),
      filename: "lottery-numbers.txt",
      stats: [
        { label: "Lines", value: n(lines), tone: "accent" },
        { label: "Jackpot odds", value: `1 in ${n(odds)}` },
      ],
      table: {
        head: ["Line", "Numbers", game.bonus ? "Bonus" : "—"],
        rows,
        caption: "Your lines",
      },
      note: "Every number is drawn without replacement using your browser's cryptographic random number generator. No sequence is luckier than another.",
      warning:
        odds > 1_000_000
          ? `The odds of matching all ${main}${game.bonus ? " plus the bonus" : ""} are about 1 in ${n(odds)}. Please play responsibly.`
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "Your numbers", mono: true, rows: 8 },
  privacyNote: "Drawn in your browser. Nothing is recorded or sent anywhere.",
  notes: [
    { label: "Odds", formula: "pool choose drawn", note: "6 from 59 is 45,057,474 combinations." },
    { label: "Hot and cold numbers", formula: "Not a thing", note: "Each draw is independent; past results tell you nothing about the next one." },
  ],
};

/* --------------------------------------------------------- random picker -- */

export const randomPicker: TextToolDef = {
  input: {
    label: "Your list",
    placeholder: "One name or option per line…",
    rows: 12,
    hint: "One entry per line.",
    accept: ".txt,.csv,text/plain",
    initial: "Ada\nGrace\nAlan\nKatherine\nDorothy\nMargaret",
  },
  deferred: true,
  generate: { label: "Pick again" },
  options: [
    { key: "count", label: "How many to pick", type: "number", initial: "1", min: 1, max: 100 },
    { key: "unique", label: "Do not pick the same entry twice", type: "checkbox", initial: "1", wide: true },
    { key: "order", label: "Number the winners in draw order", type: "checkbox", initial: "1", wide: true },
    { key: "rest", label: "Also show everyone who was not picked", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    const entries = input
      .split(/\r\n|\r|\n/u)
      .map((line) => line.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      return { note: "Put one name or option on each line and the picker will draw from them." };
    }

    const wanted = Math.min(100, Math.max(1, h.num("count", 1)));
    const unique = h.bool("unique");

    if (unique && wanted > entries.length) {
      return {
        error: `You asked for ${n(wanted)} different entries, but the list only has ${n(entries.length)}.`,
      };
    }

    const picked: string[] = [];
    if (unique) {
      // Partial shuffle: draw without replacement, in draw order.
      const pool = [...entries];
      for (let i = 0; i < wanted; i++) {
        const j = i + randomInt(pool.length - i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
        picked.push(pool[i]);
      }
    } else {
      for (let i = 0; i < wanted; i++) picked.push(entries[randomInt(entries.length)]);
    }

    const rest = entries.filter((e) => !picked.includes(e));

    return {
      output: h.bool("order")
        ? picked.map((name, i) => `${i + 1}. ${name}`).join("\n")
        : picked.join("\n"),
      filename: "picked.txt",
      stats: [
        { label: "Picked", value: n(picked.length), tone: "accent" },
        { label: "From", value: `${n(entries.length)} entries` },
        {
          label: "Each entry's chance",
          value: `${((wanted / entries.length) * 100).toFixed(1)}%`,
        },
      ],
      table: h.bool("rest") && rest.length
        ? { head: ["Not picked", ""], rows: rest.map((name) => [name, ""]), caption: "Everyone else" }
        : undefined,
      note: "Every entry is equally likely, drawn with your browser's cryptographic random number generator. Nothing is sent anywhere.",
    } satisfies TextResult;
  },
  output: { label: "The winner", mono: false, rows: 8 },
  privacyNote: "Drawn in your browser. Your list is not uploaded or stored.",
  notes: [
    { label: "Without replacement", formula: "Each entry can only win once", note: "What you want for a prize draw." },
    { label: "With replacement", formula: "Each draw is independent", note: "The same entry can come up twice." },
  ],
};

/* -------------------------------------------------------- decision maker -- */

export const decisionMaker: TextToolDef = {
  input: {
    label: "Your options",
    placeholder: "One option per line…",
    rows: 8,
    hint: "Only used by the “choose for me” mode.",
    initial: "Stay in\nGo out\nAsk someone else",
  },
  controlsTitle: "What should decide it",
  deferred: true,
  generate: { label: "Decide again" },
  options: [
    {
      key: "mode",
      label: "Method",
      type: "select",
      initial: "coin",
      wide: true,
      options: [
        { value: "coin", label: "Flip a coin" },
        { value: "yesno", label: "Yes or no" },
        { value: "dice", label: "Roll dice" },
        { value: "options", label: "Choose one of my options" },
        { value: "rank", label: "Put my options in a random order" },
      ],
    },
    { key: "flips", label: "How many flips", type: "number", initial: "1", min: 1, max: 100, when: (v) => v.mode === "coin" },
    { key: "dice", label: "How many dice", type: "number", initial: "2", min: 1, max: 20, when: (v) => v.mode === "dice" },
    { key: "sides", label: "Sides per die", type: "number", initial: "6", min: 2, max: 100, when: (v) => v.mode === "dice" },
  ],
  transform: (input, _v, h) => {
    const mode = h.str("mode") || "coin";
    const options = input
      .split(/\r\n|\r|\n/u)
      .map((line) => line.trim())
      .filter(Boolean);

    if (mode === "coin") {
      const flips = Math.min(100, Math.max(1, h.num("flips", 1)));
      const results = Array.from({ length: flips }, () => (randomInt(2) === 0 ? "Heads" : "Tails"));
      const heads = results.filter((r) => r === "Heads").length;
      return {
        output: results.join("\n"),
        filename: "coin-flips.txt",
        stats: [
          { label: "Result", value: results[0], tone: "accent" },
          { label: "Heads", value: `${heads} of ${flips}` },
          { label: "Tails", value: `${flips - heads} of ${flips}` },
        ],
        note: "A fair coin: each flip is 50/50 and knows nothing about the flips before it.",
      } satisfies TextResult;
    }

    if (mode === "yesno") {
      const answer = randomInt(2) === 0 ? "Yes" : "No";
      return {
        output: answer,
        filename: "decision.txt",
        stats: [{ label: "The answer is", value: answer, tone: answer === "Yes" ? "success" : "warning" }],
        note: "If you find yourself hoping for the other answer, you already knew what you wanted.",
      } satisfies TextResult;
    }

    if (mode === "dice") {
      const count = Math.min(20, Math.max(1, h.num("dice", 2)));
      const sides = Math.min(100, Math.max(2, h.num("sides", 6)));
      const rolls = Array.from({ length: count }, () => randomInt(sides) + 1);
      const total = rolls.reduce((sum, r) => sum + r, 0);
      return {
        output: rolls.join("  "),
        filename: "dice.txt",
        stats: [
          { label: "Total", value: n(total), tone: "accent" },
          { label: "Rolls", value: rolls.join(", ") },
          { label: "Range", value: `${count} to ${count * sides}` },
        ],
        note: `${count} × d${sides}. The average total over many rolls would be ${((count * (sides + 1)) / 2).toFixed(1)}.`,
      } satisfies TextResult;
    }

    if (options.length === 0) {
      return { note: "Add your options above, one per line, and this will choose between them." };
    }

    if (mode === "rank") {
      const ordered = shuffle(options);
      return {
        output: ordered.map((option, i) => `${i + 1}. ${option}`).join("\n"),
        filename: "order.txt",
        stats: [{ label: "First", value: ordered[0], tone: "accent" }],
        note: "A uniformly random order — every arrangement is equally likely.",
      } satisfies TextResult;
    }

    const chosen = options[randomInt(options.length)];
    return {
      output: chosen,
      filename: "decision.txt",
      stats: [
        { label: "Go with", value: chosen, tone: "accent" },
        { label: "Chance each", value: `${(100 / options.length).toFixed(1)}%` },
      ],
      note: `Chosen from ${n(options.length)} options, each equally likely.`,
    } satisfies TextResult;
  },
  output: { label: "Decision", mono: false, rows: 8 },
  privacyNote: "Decided in your browser. Your options are not sent anywhere.",
};
