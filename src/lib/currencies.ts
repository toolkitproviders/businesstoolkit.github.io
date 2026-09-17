export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** Countries/regions, used to make the picker searchable by place name. */
  region: string;
}

/** The currencies offered in pickers across the invoice, quote and converter tools. */
export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", region: "United States" },
  { code: "EUR", name: "Euro", symbol: "€", region: "Eurozone" },
  { code: "GBP", name: "British Pound", symbol: "£", region: "United Kingdom" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", region: "Japan" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", region: "China" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", region: "Australia" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", region: "Canada" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", region: "Switzerland" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", region: "Hong Kong" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", region: "Singapore" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", region: "Sweden" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", region: "Norway" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", region: "Denmark" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", region: "New Zealand" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", region: "India" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", region: "Pakistan" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", region: "Bangladesh" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", region: "Sri Lanka" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", region: "Nepal" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", region: "United Arab Emirates" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SR", region: "Saudi Arabia" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR", region: "Qatar" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", region: "Kuwait" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD", region: "Bahrain" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR", region: "Oman" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD", region: "Jordan" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", region: "Israel" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", region: "Turkey" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", region: "Russia" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", region: "Ukraine" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", region: "Poland" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", region: "Czechia" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", region: "Hungary" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", region: "Romania" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", region: "Bulgaria" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", region: "Croatia" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr", region: "Iceland" },
  { code: "ZAR", name: "South African Rand", symbol: "R", region: "South Africa" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", region: "Nigeria" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", region: "Kenya" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", region: "Ghana" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", region: "Egypt" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "DH", region: "Morocco" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", region: "Tunisia" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", region: "Uganda" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", region: "Tanzania" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", region: "Brazil" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", region: "Mexico" },
  { code: "ARS", name: "Argentine Peso", symbol: "AR$", region: "Argentina" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$", region: "Chile" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$", region: "Colombia" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", region: "Peru" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", region: "Uruguay" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", region: "South Korea" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", region: "Taiwan" },
  { code: "THB", name: "Thai Baht", symbol: "฿", region: "Thailand" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", region: "Vietnam" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", region: "Indonesia" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", region: "Malaysia" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", region: "Philippines" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛", region: "Cambodia" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K", region: "Myanmar" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", region: "Kazakhstan" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "soʻm", region: "Uzbekistan" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", region: "Azerbaijan" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾", region: "Georgia" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏", region: "Armenia" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din", region: "Serbia" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден", region: "North Macedonia" },
  { code: "ALL", name: "Albanian Lek", symbol: "L", region: "Albania" },
  { code: "MDL", name: "Moldovan Leu", symbol: "L", region: "Moldova" },
  { code: "BAM", name: "Bosnia-Herzegovina Mark", symbol: "KM", region: "Bosnia and Herzegovina" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", region: "Ethiopia" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", region: "West Africa" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", region: "Central Africa" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs", region: "Mauritius" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", region: "Botswana" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", region: "Zambia" },
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", region: "Fiji" },
  { code: "PGK", name: "Papua New Guinean Kina", symbol: "K", region: "Papua New Guinea" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$", region: "Jamaica" },
  { code: "TTD", name: "Trinidad & Tobago Dollar", symbol: "TT$", region: "Trinidad and Tobago" },
  { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$", region: "Barbados" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$", region: "Bahamas" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$", region: "Dominican Republic" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", region: "Guatemala" },
  { code: "CRC", name: "Costa Rican Colon", symbol: "₡", region: "Costa Rica" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", region: "Panama" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs", region: "Bolivia" },
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", region: "Paraguay" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L", region: "Honduras" },
  { code: "NIO", name: "Nicaraguan Cordoba", symbol: "C$", region: "Nicaragua" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ID", region: "Iraq" },
  { code: "LBP", name: "Lebanese Pound", symbol: "LL", region: "Lebanon" },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋", region: "Afghanistan" },
  { code: "IRR", name: "Iranian Rial", symbol: "IRR", region: "Iran" },
  { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", region: "Mongolia" },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf", region: "Maldives" },
  { code: "BND", name: "Brunei Dollar", symbol: "B$", region: "Brunei" },
  { code: "MOP", name: "Macanese Pataca", symbol: "MOP$", region: "Macau" },
  { code: "LAK", name: "Lao Kip", symbol: "₭", region: "Laos" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$", region: "Eastern Caribbean" },
];

const byCode = new Map(currencies.map((c) => [c.code, c]));

export function getCurrency(code: string): Currency | undefined {
  return byCode.get(code.toUpperCase());
}

export function currencySymbol(code: string): string {
  return byCode.get(code.toUpperCase())?.symbol ?? code.toUpperCase();
}

/** Zero-decimal currencies where a fractional unit does not exist. */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "PYG", "UGX", "XOF", "XAF", "LAK"]);

export function currencyDecimals(code: string): number {
  return ZERO_DECIMAL.has(code.toUpperCase()) ? 0 : 2;
}

export function searchCurrencies(query: string, limit = 60): Currency[] {
  const q = query.trim().toLowerCase();
  if (!q) return currencies.slice(0, limit);
  return currencies
    .filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

/** Formats using the currency's own decimal convention. */
export function formatMoney(amount: number, code: string, locale = "en-US"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const decimals = currencyDecimals(code);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(safe);
  } catch {
    return `${currencySymbol(code)}${safe.toFixed(decimals)}`;
  }
}
