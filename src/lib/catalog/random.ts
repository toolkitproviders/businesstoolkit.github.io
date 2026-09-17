import type { Tool } from "@/lib/tool-types";

/**
 * Random generators. Every value comes from the browser's own cryptographic
 * random number generator and is never transmitted.
 */
export const randomTools: Tool[] = [
  {
    slug: "pin-generator",
    name: "PIN Generator",
    tagline: "Random PINs that avoid the obvious ones.",
    description:
      "Generate random numeric PINs of any length, with optional rules against repeated digits, runs like 1234, and the handful of codes that dominate real-world choices.",
    category: "generators",
    icon: "lock",
    keywords: [
      "pin generator", "random pin", "4 digit pin", "6 digit pin",
      "secure pin", "random numeric code", "pin code generator",
    ],
    seoTitle: "PIN Generator — Random 4, 6 and 8-Digit PINs",
    seoDescription:
      "Generate random PINs of any length, avoiding sequences and the most-guessed codes. Created in your browser and never transmitted.",
    faq: [
      {
        q: "How secure is a four-digit PIN?",
        a: "There are only 10,000 possibilities. That is fine where the device locks after three wrong tries, and inadequate anywhere an attacker can guess freely.",
      },
      {
        q: "Why avoid PINs like 1234 or 1111?",
        a: "A small number of PINs account for a disproportionate share of real choices, and those are exactly the ones tried first. The tool discards them by default.",
      },
      {
        q: "Are the PINs generated on my device?",
        a: "Yes. They come from your browser's cryptographic random number generator and are never sent anywhere. Nothing is logged or stored.",
      },
    ],
    related: ["password-generator", "random-number-generator", "secure-token-generator", "uuid-generator"],
    privateByDefault: true,
  },
  {
    slug: "random-number-generator",
    name: "Random Number Generator",
    tagline: "Pick numbers in any range, with or without repeats.",
    description:
      "Generate random numbers between any two values, whole or decimal, with optional uniqueness and sorting — for draws, sampling and test data.",
    category: "generators",
    icon: "dice5",
    keywords: [
      "random number generator", "random number between", "rng",
      "pick a random number", "random integer", "random decimal", "number picker",
    ],
    seoTitle: "Random Number Generator — Any Range, With or Without Repeats",
    seoDescription:
      "Generate random numbers in any range, whole or decimal, with optional uniqueness and sorting. Uses your browser's cryptographic randomness.",
    faq: [
      {
        q: "Is this actually random?",
        a: "It uses crypto.getRandomValues, the browser's cryptographic random number generator, and rejects the tail of the range so the modulo does not favour low numbers.",
      },
      {
        q: "Can I use it for a prize draw?",
        a: "Yes, and the “no repeats” option is what you want so the same entrant cannot be drawn twice. For anything with real money at stake, keep a record of the draw.",
      },
      {
        q: "Are the endpoints included?",
        a: "Yes. A range of 1 to 100 can produce both 1 and 100.",
      },
    ],
    related: ["lottery-number-generator", "pin-generator", "password-generator", "sort-lines"],
    privateByDefault: true,
  },
  {
    slug: "username-generator",
    name: "Username Generator",
    tagline: "Memorable handles from words that go together.",
    description:
      "Generate available-looking usernames from adjective and noun pairs, with or without numbers, or build them from your own name — with a length limit you control.",
    category: "generators",
    icon: "user-round",
    keywords: [
      "username generator", "random username", "gamertag generator",
      "handle generator", "nickname generator", "cool usernames",
    ],
    seoTitle: "Username Generator — Memorable Handles, Instantly",
    seoDescription:
      "Generate memorable usernames from word pairs, with numbers and separators, or build them from your own name. Free and generated in your browser.",
    faq: [
      {
        q: "Are these usernames available?",
        a: "The tool cannot check — it has no connection to any service. They are suggestions; try them on the site you want and keep a couple in reserve.",
      },
      {
        q: "Should a username contain numbers?",
        a: "Numbers make a name far more likely to be free, at the cost of being harder to say out loud. Try the plain pattern first and add digits only if everything is taken.",
      },
    ],
    related: ["business-name-generator", "password-generator", "random-string-generator", "slug-generator"],
    privateByDefault: true,
  },
  {
    slug: "secure-token-generator",
    name: "Secure Token Generator",
    tagline: "API keys and signing secrets, with the entropy shown.",
    description:
      "Generate cryptographically random tokens at 128, 192, 256 or 512 bits, in hex, Base62, Base64URL or a Base32 alphabet with no look-alike characters.",
    category: "generators",
    icon: "key-square",
    keywords: [
      "token generator", "api key generator", "secret key generator",
      "jwt secret", "session token", "bearer token", "random hex key",
    ],
    seoTitle: "Secure Token Generator — API Keys and Signing Secrets",
    seoDescription:
      "Generate cryptographically random API keys and signing secrets at 128 to 512 bits, in hex, Base62, Base64URL or Base32, with entropy shown.",
    faq: [
      {
        q: "How many bits do I need?",
        a: "128 bits is the standard bar for a session token. Use 256 for API keys and signing secrets, where the value may live for years.",
      },
      {
        q: "Should I use a token generated in a browser in production?",
        a: "Ideally not. Generate production secrets on the machine that will use them. Anything that has passed through a browser, an editor or a chat window should be treated as exposed.",
      },
      {
        q: "Why add a prefix like sk_live_?",
        a: "Secret scanners in GitHub and elsewhere match on known prefixes, so a key that leaks into a commit gets caught and revoked far faster.",
      },
    ],
    related: ["random-string-generator", "password-generator", "uuid-generator", "hash-generator"],
    privateByDefault: true,
  },
  {
    slug: "lottery-number-generator",
    name: "Lottery Number Generator",
    tagline: "Quick picks for the major draws, with the real odds.",
    description:
      "Draw random lines for UK Lotto, EuroMillions, Powerball, Mega Millions or your own game, with the true jackpot odds shown alongside.",
    category: "generators",
    icon: "ticket",
    keywords: [
      "lottery number generator", "random lottery numbers", "quick pick",
      "euromillions generator", "powerball numbers", "lotto numbers", "lucky dip",
    ],
    seoTitle: "Lottery Number Generator — Quick Picks and Real Odds",
    seoDescription:
      "Generate random lines for UK Lotto, EuroMillions, Powerball, Mega Millions or a custom game, with the true jackpot odds. Drawn in your browser.",
    faq: [
      {
        q: "Do random numbers give me a better chance?",
        a: "No combination is more likely than another. Randomly chosen numbers do reduce the chance of sharing a jackpot, because many people pick birthdays and patterns.",
      },
      {
        q: "Are hot and cold numbers real?",
        a: "No. Each draw is independent of every draw before it, so past frequencies tell you nothing about the next one.",
      },
      {
        q: "How are the odds worked out?",
        a: "The number of ways to choose the main numbers from the pool, multiplied by the ways to choose any bonus numbers. For 6 from 59 that is 45,057,474 combinations.",
      },
    ],
    related: ["random-number-generator", "pin-generator", "percentage-calculator", "sort-lines"],
    privateByDefault: true,
  },
];
