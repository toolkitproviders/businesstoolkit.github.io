/**
 * Barcode format rules and input validation.
 *
 * Kept free of React so the encoding rules — which are the part that must be
 * exactly right for a scanner to read the result — can be tested directly.
 */

export type BarcodeFormat = "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "ITF";

export interface FormatSpec {
  value: BarcodeFormat;
  label: string;
  description: string;
  placeholder: string;
  sample: string;
}

export const BARCODE_FORMATS: FormatSpec[] = [
  {
    value: "CODE128",
    label: "Code 128",
    description: "Any ASCII text. The general-purpose choice for business and logistics.",
    placeholder: "SKU-4821-AB",
    sample: "SKU-4821-AB",
  },
  {
    value: "CODE39",
    label: "Code 39",
    description: "Uppercase letters, digits and - . $ / + % and space. Common in older systems.",
    placeholder: "PART-1234",
    sample: "PART-1234",
  },
  {
    value: "EAN13",
    label: "EAN-13",
    description: "13 digits for retail products. Enter 12 and the check digit is calculated.",
    placeholder: "590123412345",
    sample: "590123412345",
  },
  {
    value: "EAN8",
    label: "EAN-8",
    description: "8 digits for small retail packaging. Enter 7 and the check digit is calculated.",
    placeholder: "9638507",
    sample: "9638507",
  },
  {
    value: "UPC",
    label: "UPC-A",
    description: "12 digits, used for retail in North America. Enter 11 for an auto check digit.",
    placeholder: "03600029145",
    sample: "03600029145",
  },
  {
    value: "ITF",
    label: "ITF",
    description: "An even number of digits. Used on shipping cartons.",
    placeholder: "12345678",
    sample: "12345678",
  },
];

/**
 * GS1 mod-10 check digit, used by EAN-8, EAN-13 and UPC-A.
 * Weights alternate 3/1 starting from the rightmost data digit.
 */
export function checkDigit(digits: string): number {
  let sum = 0;
  for (let i = digits.length - 1, weight = 3; i >= 0; i -= 1, weight = weight === 3 ? 1 : 3) {
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

export interface Validation {
  ok: boolean;
  error?: string;
  /** Value actually handed to the encoder — may include a computed check digit. */
  encoded: string;
  note?: string;
}

export function validateBarcode(format: BarcodeFormat, raw: string): Validation {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Enter a value to encode.", encoded: "" };

  switch (format) {
    case "CODE128": {
      if (!/^[ -~]+$/.test(value)) {
        return { ok: false, error: "Code 128 supports ASCII characters only.", encoded: "" };
      }
      return { ok: true, encoded: value };
    }
    case "CODE39": {
      const upper = value.toUpperCase();
      if (!/^[A-Z0-9\-. $/+%]+$/.test(upper)) {
        return {
          ok: false,
          error: "Code 39 allows A–Z, 0–9, space and - . $ / + % only.",
          encoded: "",
        };
      }
      return {
        ok: true,
        encoded: upper,
        note: upper !== value ? "Converted to uppercase — Code 39 has no lowercase." : undefined,
      };
    }
    case "EAN13":
      return validateGs1(value, 12, "EAN-13");
    case "EAN8":
      return validateGs1(value, 7, "EAN-8");
    case "UPC":
      return validateGs1(value, 11, "UPC-A");
    case "ITF": {
      if (!/^\d+$/.test(value)) {
        return { ok: false, error: "ITF accepts digits only.", encoded: "" };
      }
      if (value.length % 2 !== 0) {
        return {
          ok: false,
          error: `ITF needs an even number of digits — you have ${value.length}.`,
          encoded: "",
        };
      }
      return { ok: true, encoded: value };
    }
  }
}

function validateGs1(value: string, dataLength: number, label: string): Validation {
  if (!/^\d+$/.test(value)) {
    return { ok: false, error: `${label} accepts digits only.`, encoded: "" };
  }
  if (value.length === dataLength) {
    const digit = checkDigit(value);
    return {
      ok: true,
      encoded: `${value}${digit}`,
      note: `Check digit ${digit} calculated and appended.`,
    };
  }
  if (value.length === dataLength + 1) {
    const expected = checkDigit(value.slice(0, dataLength));
    if (expected !== Number(value[dataLength])) {
      return {
        ok: false,
        error: `Invalid check digit. For ${value.slice(0, dataLength)} the last digit should be ${expected}.`,
        encoded: "",
      };
    }
    return { ok: true, encoded: value };
  }
  return {
    ok: false,
    error: `${label} needs ${dataLength} or ${dataLength + 1} digits — you entered ${value.length}.`,
    encoded: "",
  };
}
