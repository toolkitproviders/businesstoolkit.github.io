import type { Tool } from "@/lib/tool-types";

/**
 * Unit converters. Each one is a table of exact factors fed through the shared
 * calculator engine, so every converter behaves identically and shows the value
 * in every unit of its family at once.
 */
export const unitTools: Tool[] = [
  {
    slug: "length-converter",
    name: "Length Converter",
    tagline: "Millimetres to miles, and everything between.",
    description:
      "Convert between metric and imperial lengths using the exact international definitions, and see your value in every unit at once.",
    category: "units",
    icon: "ruler",
    keywords: [
      "length converter", "cm to inches", "inches to cm", "metres to feet",
      "km to miles", "mm to inches", "feet to metres", "distance converter",
    ],
    seoTitle: "Length Converter — cm, Inches, Feet, Metres & Miles",
    seoDescription:
      "Convert length between millimetres, centimetres, metres, kilometres, inches, feet, yards and miles. Exact factors, every unit shown at once.",
    faq: [
      {
        q: "How many centimetres are in an inch?",
        a: "Exactly 2.54. The inch was defined against the metre in 1959 as 0.0254 m precisely, so the conversion is not an approximation.",
      },
      {
        q: "Why is a nautical mile different from a mile?",
        a: "A nautical mile is 1,852 m — one minute of latitude — which makes chart work straightforward. A statute mile is 1,609.344 m.",
      },
      {
        q: "Is the calculation done on my device?",
        a: "Yes. The factors are built into the page and the arithmetic runs in your browser, so nothing you type is sent anywhere.",
      },
    ],
    related: ["area-converter", "weight-converter", "volume-converter", "speed-converter"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "weight-converter",
    name: "Weight Converter",
    tagline: "Kilograms, pounds, stones, ounces and tons.",
    description:
      "Convert between metric and imperial mass units — grams, kilograms, tonnes, ounces, pounds, stones and both kinds of ton.",
    category: "units",
    icon: "weight",
    keywords: [
      "weight converter", "kg to lbs", "lbs to kg", "grams to ounces",
      "stone to kg", "pounds to stone", "mass converter", "tonnes to tons",
    ],
    seoTitle: "Weight Converter — kg, lbs, Stone, Ounces & Tons",
    seoDescription:
      "Convert weight between kilograms, grams, pounds, ounces, stones and tonnes using the exact definitions. Every unit shown at once, free.",
    faq: [
      {
        q: "How many pounds are in a kilogram?",
        a: "About 2.20462. The pound is defined as exactly 0.45359237 kg, so dividing by that gives the precise figure.",
      },
      {
        q: "What is the difference between a US and a UK ton?",
        a: "A US short ton is 2,000 lb (907.18 kg); a UK long ton is 2,240 lb (1,016.05 kg). A metric tonne is 1,000 kg, between the two.",
      },
      {
        q: "Is this weight or mass?",
        a: "Strictly these are units of mass. Weight is the force gravity exerts on that mass, but in everyday use on Earth the two are used interchangeably.",
      },
    ],
    related: ["length-converter", "volume-converter", "area-converter", "temperature-converter"],
    privateByDefault: true,
  },
  {
    slug: "temperature-converter",
    name: "Temperature Converter",
    tagline: "Celsius, Fahrenheit, Kelvin and Rankine.",
    description:
      "Convert temperatures between all four scales, with the formulas shown so you can check the arithmetic yourself.",
    category: "units",
    icon: "thermometer",
    keywords: [
      "temperature converter", "celsius to fahrenheit", "fahrenheit to celsius",
      "c to f", "f to c", "kelvin converter", "degrees converter",
    ],
    seoTitle: "Temperature Converter — Celsius, Fahrenheit & Kelvin",
    seoDescription:
      "Convert between Celsius, Fahrenheit, Kelvin and Rankine instantly, with the conversion formulas shown. Free and calculated in your browser.",
    faq: [
      {
        q: "How do I convert Celsius to Fahrenheit?",
        a: "Multiply by 9/5 and add 32. So 20 °C × 1.8 = 36, plus 32 = 68 °F. Going the other way, subtract 32 first, then multiply by 5/9.",
      },
      {
        q: "Is there a temperature where both scales agree?",
        a: "Yes, −40. Minus forty degrees Celsius is exactly minus forty degrees Fahrenheit, which is the only point the two scales meet.",
      },
      {
        q: "What is Rankine?",
        a: "An absolute scale using Fahrenheit-sized degrees, still used in some US engineering work. Zero Rankine is absolute zero, as with Kelvin.",
      },
    ],
    related: ["length-converter", "weight-converter", "speed-converter", "volume-converter"],
    privateByDefault: true,
  },
  {
    slug: "area-converter",
    name: "Area Converter",
    tagline: "Square metres, feet, acres and hectares.",
    description:
      "Convert areas between metric and imperial units — useful for floor plans, land, flooring quotes and paint coverage.",
    category: "units",
    icon: "square",
    keywords: [
      "area converter", "square feet to square metres", "acres to hectares",
      "sqm to sqft", "hectares to acres", "land area converter",
    ],
    seoTitle: "Area Converter — Square Metres, Feet, Acres & Hectares",
    seoDescription:
      "Convert area between square metres, square feet, square yards, acres, hectares and square miles. Exact factors, shown in every unit.",
    faq: [
      {
        q: "How many square feet are in a square metre?",
        a: "About 10.7639. A foot is 0.3048 m, so a square foot is 0.3048² = 0.09290304 m², and one square metre is the reciprocal of that.",
      },
      {
        q: "How big is an acre?",
        a: "4,046.856 m², or 43,560 square feet. A hectare is 10,000 m², so one hectare is about 2.471 acres.",
      },
    ],
    related: ["length-converter", "volume-converter", "weight-converter", "speed-converter"],
    privateByDefault: true,
  },
  {
    slug: "volume-converter",
    name: "Volume Converter",
    tagline: "Litres, pints, gallons, cups and cubic metres.",
    description:
      "Convert volumes between metric, US and UK measures, with the US and UK pints and gallons kept properly separate.",
    category: "units",
    icon: "beaker",
    keywords: [
      "volume converter", "litres to gallons", "ml to oz", "cups to ml",
      "pints to litres", "gallons to litres", "cooking measurements",
    ],
    seoTitle: "Volume Converter — Litres, Gallons, Pints, Cups & ml",
    seoDescription:
      "Convert volume between litres, millilitres, cups, pints, quarts and gallons, with US and UK measures kept separate. Free and exact.",
    faq: [
      {
        q: "Is a US pint the same as a UK pint?",
        a: "No, and it catches people out. A UK pint is 568 ml; a US pint is 473 ml. The gallons differ too: 4.546 L in the UK, 3.785 L in the US.",
      },
      {
        q: "How many millilitres are in a cup?",
        a: "A US cup is 236.6 ml. A metric cup used in Australia and New Zealand is 250 ml, and UK recipes usually work by weight instead.",
      },
    ],
    related: ["weight-converter", "length-converter", "area-converter", "time-converter"],
    privateByDefault: true,
  },
  {
    slug: "speed-converter",
    name: "Speed Converter",
    tagline: "km/h, mph, knots and metres per second.",
    description:
      "Convert speeds between kilometres per hour, miles per hour, knots, feet per second, metres per second and Mach.",
    category: "units",
    icon: "gauge",
    keywords: [
      "speed converter", "kmh to mph", "mph to kmh", "knots to mph",
      "m/s to km/h", "velocity converter", "pace converter",
    ],
    seoTitle: "Speed Converter — km/h, mph, Knots and m/s",
    seoDescription:
      "Convert speed between kilometres per hour, miles per hour, knots, feet per second and metres per second. Instant and browser-based.",
    faq: [
      {
        q: "How do I convert km/h to mph?",
        a: "Multiply by 0.621371. A 100 km/h limit is about 62 mph; a 30 mph limit is about 48 km/h.",
      },
      {
        q: "What is a knot?",
        a: "One nautical mile per hour, or 1.852 km/h. Ships and aircraft use it because a nautical mile is one minute of latitude on a chart.",
      },
    ],
    related: ["length-converter", "time-converter", "temperature-converter", "data-storage-converter"],
    privateByDefault: true,
  },
  {
    slug: "data-storage-converter",
    name: "Data Storage Converter",
    tagline: "Bytes, megabytes, gibibytes — and why they differ.",
    description:
      "Convert between bits, bytes and every multiple, covering both the 1,000-based units drive makers use and the 1,024-based units your computer shows.",
    category: "units",
    icon: "hard-drive",
    keywords: [
      "data storage converter", "mb to gb", "gb to tb", "bytes converter",
      "gib vs gb", "mebibyte", "file size converter", "kb to mb",
    ],
    seoTitle: "Data Storage Converter — MB, GB, TB, MiB and GiB",
    seoDescription:
      "Convert bits, bytes, kilobytes, megabytes, gigabytes and terabytes, including the 1,024-based KiB, MiB and GiB units. Free and instant.",
    faq: [
      {
        q: "Why does my 1 TB drive show as 931 GB?",
        a: "The maker counts a terabyte as 1,000,000,000,000 bytes. Your operating system divides by 1,024 three times, giving 931 gibibytes — the same bytes, a different unit.",
      },
      {
        q: "What is the difference between GB and GiB?",
        a: "A gigabyte is 1,000³ bytes; a gibibyte is 1,024³ bytes, about 7.4% more. The IEC introduced KiB, MiB and GiB in 1998 to end the ambiguity.",
      },
      {
        q: "How many bits are in a byte?",
        a: "Eight. Network speeds are usually quoted in bits per second and file sizes in bytes, which is why a 100 Mb/s line downloads at about 12.5 MB/s.",
      },
    ],
    related: ["time-converter", "speed-converter", "length-converter", "image-compressor"],
    privateByDefault: true,
  },
  {
    slug: "time-converter",
    name: "Time Unit Converter",
    tagline: "Seconds, minutes, hours, days, weeks and years.",
    description:
      "Convert a duration between every common time unit, from nanoseconds to years — useful for timeouts, billing and estimates.",
    category: "units",
    icon: "hourglass",
    keywords: [
      "time converter", "minutes to hours", "seconds to minutes",
      "hours to days", "days to weeks", "duration converter", "milliseconds to seconds",
    ],
    seoTitle: "Time Unit Converter — Seconds, Minutes, Hours and Days",
    seoDescription:
      "Convert a duration between nanoseconds, seconds, minutes, hours, days, weeks, months and years. Free converter that runs in your browser.",
    faq: [
      {
        q: "How long is a month here?",
        a: "Thirty days, and a year is 365. Calendar months vary, so use a date difference tool when the actual dates matter.",
      },
      {
        q: "How many seconds are in a day?",
        a: "86,400 — that is 60 × 60 × 24. A week is 604,800 and a 365-day year is 31,536,000.",
      },
    ],
    related: ["timestamp-converter", "speed-converter", "data-storage-converter", "cron-expression-helper"],
    privateByDefault: true,
  },
];
