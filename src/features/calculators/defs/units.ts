import type { CalculatorDef, CalcField } from "../types";

/**
 * Unit converters.
 *
 * Each category is a table of units expressed against one base unit, so a
 * conversion is always `fromBase(toBase(value))` and there is exactly one
 * factor per unit to get wrong. Temperature is the odd one out — it has an
 * offset as well as a scale — so its units carry functions instead.
 *
 * The factors below are the exact internationally agreed definitions, not
 * rounded approximations: an inch is exactly 0.0254 m, a pound exactly
 * 0.45359237 kg, and a US gallon exactly 3.785411784 L.
 */

export interface Unit {
  key: string;
  label: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

/** A unit that is a straight multiple of the base unit. */
function linear(key: string, label: string, symbol: string, factor: number): Unit {
  return {
    key,
    label,
    symbol,
    toBase: (value) => value * factor,
    fromBase: (value) => value / factor,
  };
}

export interface UnitCategory {
  base: string;
  units: Unit[];
}

/* ---------------------------------------------------------------- length -- */

export const LENGTH: UnitCategory = {
  base: "metre",
  units: [
    linear("nm", "Nanometre", "nm", 1e-9),
    linear("um", "Micrometre", "µm", 1e-6),
    linear("mm", "Millimetre", "mm", 0.001),
    linear("cm", "Centimetre", "cm", 0.01),
    linear("m", "Metre", "m", 1),
    linear("km", "Kilometre", "km", 1000),
    linear("in", "Inch", "in", 0.0254),
    linear("ft", "Foot", "ft", 0.3048),
    linear("yd", "Yard", "yd", 0.9144),
    linear("mi", "Mile", "mi", 1609.344),
    linear("nmi", "Nautical mile", "nmi", 1852),
  ],
};

/* ------------------------------------------------------------------ mass -- */

export const WEIGHT: UnitCategory = {
  base: "kilogram",
  units: [
    linear("mcg", "Microgram", "µg", 1e-9),
    linear("mg", "Milligram", "mg", 1e-6),
    linear("g", "Gram", "g", 0.001),
    linear("kg", "Kilogram", "kg", 1),
    linear("t", "Tonne (metric)", "t", 1000),
    linear("ct", "Carat", "ct", 0.0002),
    linear("oz", "Ounce", "oz", 0.028349523125),
    linear("lb", "Pound", "lb", 0.45359237),
    linear("st", "Stone", "st", 6.35029318),
    linear("ton_us", "Ton (US short)", "ton", 907.18474),
    linear("ton_uk", "Ton (UK long)", "ton", 1016.0469088),
  ],
};

/* ----------------------------------------------------------- temperature -- */

export const TEMPERATURE: UnitCategory = {
  base: "degree Celsius",
  units: [
    { key: "c", label: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
    {
      key: "f",
      label: "Fahrenheit",
      symbol: "°F",
      toBase: (v) => ((v - 32) * 5) / 9,
      fromBase: (v) => (v * 9) / 5 + 32,
    },
    {
      key: "k",
      label: "Kelvin",
      symbol: "K",
      toBase: (v) => v - 273.15,
      fromBase: (v) => v + 273.15,
    },
    {
      key: "r",
      label: "Rankine",
      symbol: "°R",
      toBase: (v) => ((v - 491.67) * 5) / 9,
      fromBase: (v) => ((v + 273.15) * 9) / 5,
    },
  ],
};

/* ------------------------------------------------------------------ area -- */

export const AREA: UnitCategory = {
  base: "square metre",
  units: [
    linear("mm2", "Square millimetre", "mm²", 1e-6),
    linear("cm2", "Square centimetre", "cm²", 1e-4),
    linear("m2", "Square metre", "m²", 1),
    linear("ha", "Hectare", "ha", 10000),
    linear("km2", "Square kilometre", "km²", 1e6),
    linear("in2", "Square inch", "in²", 0.00064516),
    linear("ft2", "Square foot", "ft²", 0.09290304),
    linear("yd2", "Square yard", "yd²", 0.83612736),
    linear("ac", "Acre", "ac", 4046.8564224),
    linear("mi2", "Square mile", "mi²", 2589988.110336),
  ],
};

/* ---------------------------------------------------------------- volume -- */

export const VOLUME: UnitCategory = {
  base: "litre",
  units: [
    linear("ml", "Millilitre", "ml", 0.001),
    linear("cl", "Centilitre", "cl", 0.01),
    linear("l", "Litre", "L", 1),
    linear("m3", "Cubic metre", "m³", 1000),
    linear("cm3", "Cubic centimetre", "cm³", 0.001),
    linear("in3", "Cubic inch", "in³", 0.016387064),
    linear("ft3", "Cubic foot", "ft³", 28.316846592),
    linear("tsp_us", "Teaspoon (US)", "tsp", 0.00492892159375),
    linear("tbsp_us", "Tablespoon (US)", "tbsp", 0.01478676478125),
    linear("floz_us", "Fluid ounce (US)", "fl oz", 0.0295735295625),
    linear("cup_us", "Cup (US)", "cup", 0.2365882365),
    linear("pt_us", "Pint (US)", "pt", 0.473176473),
    linear("qt_us", "Quart (US)", "qt", 0.946352946),
    linear("gal_us", "Gallon (US)", "gal", 3.785411784),
    linear("floz_uk", "Fluid ounce (UK)", "fl oz", 0.0284130625),
    linear("pt_uk", "Pint (UK)", "pt", 0.56826125),
    linear("gal_uk", "Gallon (UK)", "gal", 4.54609),
  ],
};

/* ----------------------------------------------------------------- speed -- */

export const SPEED: UnitCategory = {
  base: "metre per second",
  units: [
    linear("mps", "Metres per second", "m/s", 1),
    linear("kph", "Kilometres per hour", "km/h", 1000 / 3600),
    linear("mph", "Miles per hour", "mph", 0.44704),
    linear("fps", "Feet per second", "ft/s", 0.3048),
    linear("kn", "Knots", "kn", 1852 / 3600),
    linear("mach", "Mach (at sea level)", "Ma", 340.29),
  ],
};

/* ------------------------------------------------------------------ data -- */

export const DATA: UnitCategory = {
  base: "byte",
  units: [
    linear("bit", "Bit", "b", 0.125),
    linear("B", "Byte", "B", 1),
    linear("kB", "Kilobyte (1,000 B)", "kB", 1e3),
    linear("MB", "Megabyte (1,000 kB)", "MB", 1e6),
    linear("GB", "Gigabyte (1,000 MB)", "GB", 1e9),
    linear("TB", "Terabyte (1,000 GB)", "TB", 1e12),
    linear("PB", "Petabyte (1,000 TB)", "PB", 1e15),
    linear("KiB", "Kibibyte (1,024 B)", "KiB", 1024),
    linear("MiB", "Mebibyte (1,024 KiB)", "MiB", 1048576),
    linear("GiB", "Gibibyte (1,024 MiB)", "GiB", 1073741824),
    linear("TiB", "Tebibyte (1,024 GiB)", "TiB", 1099511627776),
  ],
};

/* ------------------------------------------------------------------ time -- */

export const TIME: UnitCategory = {
  base: "second",
  units: [
    linear("ns", "Nanosecond", "ns", 1e-9),
    linear("us", "Microsecond", "µs", 1e-6),
    linear("ms", "Millisecond", "ms", 0.001),
    linear("s", "Second", "s", 1),
    linear("min", "Minute", "min", 60),
    linear("h", "Hour", "h", 3600),
    linear("d", "Day", "d", 86400),
    linear("wk", "Week", "wk", 604800),
    linear("mo", "Month (30 days)", "mo", 2592000),
    linear("yr", "Year (365 days)", "yr", 31536000),
  ],
};

/* ------------------------------------------------------------- formatting -- */

/**
 * Converters span from nanometres to petabytes, so a fixed number of decimal
 * places is useless. This keeps a set number of significant figures, drops the
 * trailing zeros, and falls back to exponent notation only when a plain
 * decimal would be unreadable.
 *
 * Eight figures is the default: enough that nobody loses precision they were
 * going to use, few enough that 39.370079 in does not read as 39.3700787402 in.
 */
export function formatUnitValue(value: number, significantFigures = 8): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const magnitude = Math.abs(value);
  if (magnitude >= 1e15 || magnitude < 1e-9) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }

  const rounded = Number(value.toPrecision(significantFigures));
  // Group the integer part so 1234567 reads as 1,234,567.
  const [whole, fraction] = String(rounded).split(".");
  const grouped = Number(whole).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function convert(category: UnitCategory, value: number, from: string, to: string): number {
  // Same unit in and out: return the value untouched rather than multiplying
  // and dividing by the same factor, which does not always land back exactly.
  if (from === to) return value;
  const source = category.units.find((u) => u.key === from) ?? category.units[0];
  const target = category.units.find((u) => u.key === to) ?? category.units[0];
  return target.fromBase(source.toBase(value));
}

/* --------------------------------------------------------- the generator -- */

function unitField(key: string, label: string, category: UnitCategory, initial: string): CalcField {
  return {
    key,
    label,
    type: "select",
    initial,
    options: category.units.map((u) => ({ value: u.key, label: `${u.label} (${u.symbol})` })),
  };
}

/**
 * Builds a converter definition from a unit table. Every converter on the
 * site is one call to this, which is why they cannot drift apart.
 */
export function unitConverter(
  category: UnitCategory,
  options: {
    from: string;
    to: string;
    initial?: string;
    label?: string;
    note?: string;
    formulas?: { label: string; formula: string; note?: string }[];
  },
): CalculatorDef {
  const unitName = (key: string) => category.units.find((u) => u.key === key);

  return {
    inputTitle: "Convert",
    inputDescription: options.label,
    resultTitle: "Converted value",
    fields: [
      {
        key: "value",
        label: "Value",
        type: "number",
        initial: options.initial ?? "1",
        step: "any",
        wide: true,
      },
      unitField("from", "From", category, options.from),
      unitField("to", "To", category, options.to),
    ],
    compute: (_values, h) => {
      const value = h.num("value");
      const from = h.str("from") || options.from;
      const to = h.str("to") || options.to;
      const source = unitName(from);
      const target = unitName(to);
      const result = convert(category, value, from, to);

      return {
        outputs: [
          {
            label: `In ${target?.label.toLowerCase() ?? "the target unit"}`,
            value: `${formatUnitValue(result)} ${target?.symbol ?? ""}`.trim(),
            sub: `${formatUnitValue(value)} ${source?.symbol ?? ""} converted`,
            tone: "accent",
            copy: String(Number(result.toPrecision(12))),
          },
          {
            label: "Exact value",
            value: String(Number(result.toPrecision(12))),
            sub: "Unrounded, ready to paste",
          },
        ],
        note: options.note,
        // Everything at once, so a second conversion needs no second visit.
        table: {
          head: ["Unit", "Value"],
          rows: category.units.map((u) => [
            `${u.label} (${u.symbol})`,
            formatUnitValue(convert(category, value, from, u.key)),
          ]),
          caption: `${formatUnitValue(value)} ${source?.symbol ?? ""} in every unit`,
        },
      };
    },
    formulas: options.formulas,
  };
}

export const lengthConverter = unitConverter(LENGTH, {
  from: "cm",
  to: "in",
  initial: "100",
  label: "Metric and imperial lengths, converted exactly.",
  formulas: [
    { label: "Inch", formula: "1 in = 0.0254 m exactly", note: "Agreed internationally in 1959." },
    { label: "Mile", formula: "1 mi = 1,609.344 m = 5,280 ft" },
    { label: "Nautical mile", formula: "1 nmi = 1,852 m", note: "One minute of latitude." },
  ],
});

export const weightConverter = unitConverter(WEIGHT, {
  from: "kg",
  to: "lb",
  initial: "70",
  label: "Grams, kilograms, pounds, stones and tons.",
  note: "These are units of mass. On Earth people use them interchangeably with weight, which is a force.",
  formulas: [
    { label: "Pound", formula: "1 lb = 0.453 592 37 kg exactly" },
    { label: "Ounce", formula: "1 oz = 1/16 lb = 28.349 523 125 g" },
    { label: "Stone", formula: "1 st = 14 lb = 6.350 293 18 kg" },
  ],
});

export const temperatureConverter = unitConverter(TEMPERATURE, {
  from: "c",
  to: "f",
  initial: "20",
  label: "Celsius, Fahrenheit, Kelvin and Rankine.",
  formulas: [
    { label: "Celsius to Fahrenheit", formula: "°F = °C × 9/5 + 32" },
    { label: "Fahrenheit to Celsius", formula: "°C = (°F − 32) × 5/9" },
    { label: "Celsius to Kelvin", formula: "K = °C + 273.15" },
    { label: "Meeting point", formula: "−40 °C = −40 °F", note: "The only temperature where the two scales agree." },
  ],
});

export const areaConverter = unitConverter(AREA, {
  from: "m2",
  to: "ft2",
  initial: "100",
  label: "Square metres, feet, acres and hectares.",
  formulas: [
    { label: "Hectare", formula: "1 ha = 10,000 m²", note: "A square 100 m on each side." },
    { label: "Acre", formula: "1 ac = 4,046.856 422 4 m² = 43,560 ft²" },
    { label: "Square foot", formula: "1 ft² = 0.092 903 04 m²" },
  ],
});

export const volumeConverter = unitConverter(VOLUME, {
  from: "l",
  to: "gal_us",
  initial: "1",
  label: "Litres, millilitres, pints, gallons and cups.",
  note: "US and UK measures of the same name differ: a UK pint is 568 ml, a US pint 473 ml.",
  formulas: [
    { label: "US gallon", formula: "1 US gal = 3.785 411 784 L" },
    { label: "UK gallon", formula: "1 UK gal = 4.546 09 L" },
    { label: "Cubic metre", formula: "1 m³ = 1,000 L" },
  ],
});

export const speedConverter = unitConverter(SPEED, {
  from: "kph",
  to: "mph",
  initial: "100",
  label: "km/h, mph, knots and metres per second.",
  formulas: [
    { label: "Miles per hour", formula: "1 mph = 0.447 04 m/s" },
    { label: "Kilometres per hour", formula: "1 km/h = 1,000 ÷ 3,600 m/s" },
    { label: "Knot", formula: "1 kn = 1 nautical mile per hour = 1,852 ÷ 3,600 m/s" },
  ],
});

export const dataConverter = unitConverter(DATA, {
  from: "MB",
  to: "MiB",
  initial: "1024",
  label: "Bytes, kilobytes and the 1,024-based units.",
  note: "Storage makers count a gigabyte as 1,000,000,000 bytes; operating systems often show gibibytes (1,073,741,824 bytes), which is why a “1 TB” drive shows as about 931 GB.",
  formulas: [
    { label: "Decimal (SI)", formula: "1 kB = 1,000 B, 1 MB = 1,000 kB" },
    { label: "Binary (IEC)", formula: "1 KiB = 1,024 B, 1 MiB = 1,024 KiB" },
    { label: "Byte", formula: "1 B = 8 bits" },
  ],
});

export const timeConverter = unitConverter(TIME, {
  from: "h",
  to: "min",
  initial: "1",
  label: "Seconds, minutes, hours, days and years.",
  note: "A month is taken as 30 days and a year as 365 days. Use the date tools when calendar months matter.",
  formulas: [
    { label: "Hour", formula: "1 h = 60 min = 3,600 s" },
    { label: "Day", formula: "1 d = 86,400 s" },
    { label: "Week", formula: "1 wk = 604,800 s" },
  ],
});

/** Every unit table, so the test suite can sweep them all. */
export const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  length: LENGTH,
  weight: WEIGHT,
  temperature: TEMPERATURE,
  area: AREA,
  volume: VOLUME,
  speed: SPEED,
  data: DATA,
  time: TIME,
};
