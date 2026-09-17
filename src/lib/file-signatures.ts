/**
 * File type detection from the first bytes of a file.
 *
 * A file's extension and its declared MIME type are both just claims — the
 * browser takes the extension at face value and an uploaded file can say
 * anything. The signature at the start of the bytes is the one thing that
 * actually reflects the contents, which is what makes a renamed file findable.
 *
 * Pure, so the test suite exercises it on byte arrays directly.
 */

export interface Signature {
  label: string;
  mime: string;
  extensions: string[];
  /** Byte values to match; null means "any byte here". */
  magic: (number | null)[];
  /** Where the magic starts. Almost always 0; ISO media boxes start at 4. */
  offset?: number;
}

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0));

/**
 * Ordered most specific first, because several formats share a prefix — every
 * ISO media file starts with "ftyp", and every Office document is a ZIP.
 */
export const SIGNATURES: Signature[] = [
  { label: "PNG image", mime: "image/png", extensions: ["png"], magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { label: "JPEG image", mime: "image/jpeg", extensions: ["jpg", "jpeg"], magic: [0xff, 0xd8, 0xff] },
  { label: "GIF image", mime: "image/gif", extensions: ["gif"], magic: ascii("GIF8") },
  { label: "BMP image", mime: "image/bmp", extensions: ["bmp"], magic: ascii("BM") },
  { label: "TIFF image (little endian)", mime: "image/tiff", extensions: ["tif", "tiff"], magic: [0x49, 0x49, 0x2a, 0x00] },
  { label: "TIFF image (big endian)", mime: "image/tiff", extensions: ["tif", "tiff"], magic: [0x4d, 0x4d, 0x00, 0x2a] },
  { label: "Windows icon", mime: "image/x-icon", extensions: ["ico"], magic: [0x00, 0x00, 0x01, 0x00] },

  { label: "WebP image", mime: "image/webp", extensions: ["webp"], magic: [...ascii("RIFF"), null, null, null, null, ...ascii("WEBP")] },
  { label: "WAV audio", mime: "audio/wav", extensions: ["wav"], magic: [...ascii("RIFF"), null, null, null, null, ...ascii("WAVE")] },
  { label: "AVI video", mime: "video/x-msvideo", extensions: ["avi"], magic: [...ascii("RIFF"), null, null, null, null, ...ascii("AVI ")] },

  { label: "AVIF image", mime: "image/avif", extensions: ["avif"], magic: ascii("ftypavif"), offset: 4 },
  { label: "HEIC image", mime: "image/heic", extensions: ["heic"], magic: ascii("ftypheic"), offset: 4 },
  { label: "MP4 video", mime: "video/mp4", extensions: ["mp4", "m4v"], magic: ascii("ftyp"), offset: 4 },

  { label: "PDF document", mime: "application/pdf", extensions: ["pdf"], magic: ascii("%PDF-") },
  { label: "SQLite database", mime: "application/vnd.sqlite3", extensions: ["sqlite", "db"], magic: ascii("SQLite format 3") },
  { label: "RTF document", mime: "application/rtf", extensions: ["rtf"], magic: ascii("{\\rtf") },

  { label: "ZIP archive (or a .docx, .xlsx, .pptx, .odt or .epub)", mime: "application/zip", extensions: ["zip", "docx", "xlsx", "pptx", "odt", "epub", "jar"], magic: [0x50, 0x4b, 0x03, 0x04] },
  { label: "ZIP archive (empty)", mime: "application/zip", extensions: ["zip"], magic: [0x50, 0x4b, 0x05, 0x06] },
  { label: "GZIP archive", mime: "application/gzip", extensions: ["gz"], magic: [0x1f, 0x8b] },
  { label: "RAR archive", mime: "application/vnd.rar", extensions: ["rar"], magic: ascii("Rar!") },
  { label: "7-Zip archive", mime: "application/x-7z-compressed", extensions: ["7z"], magic: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { label: "Legacy Office document (.doc, .xls, .ppt)", mime: "application/x-cfb", extensions: ["doc", "xls", "ppt"], magic: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },

  { label: "MP3 audio (with ID3 tag)", mime: "audio/mpeg", extensions: ["mp3"], magic: ascii("ID3") },
  { label: "MP3 audio", mime: "audio/mpeg", extensions: ["mp3"], magic: [0xff, 0xfb] },
  { label: "OGG media", mime: "audio/ogg", extensions: ["ogg", "oga", "ogv"], magic: ascii("OggS") },
  { label: "FLAC audio", mime: "audio/flac", extensions: ["flac"], magic: ascii("fLaC") },
  { label: "Matroska video", mime: "video/x-matroska", extensions: ["mkv", "webm"], magic: [0x1a, 0x45, 0xdf, 0xa3] },

  { label: "Windows executable", mime: "application/vnd.microsoft.portable-executable", extensions: ["exe", "dll"], magic: [0x4d, 0x5a] },
  { label: "Linux executable (ELF)", mime: "application/x-elf", extensions: [], magic: [0x7f, 0x45, 0x4c, 0x46] },
  { label: "Java class file", mime: "application/java-vm", extensions: ["class"], magic: [0xca, 0xfe, 0xba, 0xbe] },
  { label: "WebAssembly module", mime: "application/wasm", extensions: ["wasm"], magic: [0x00, 0x61, 0x73, 0x6d] },

  { label: "WOFF font", mime: "font/woff", extensions: ["woff"], magic: ascii("wOFF") },
  { label: "WOFF2 font", mime: "font/woff2", extensions: ["woff2"], magic: ascii("wOF2") },
  { label: "TrueType font", mime: "font/ttf", extensions: ["ttf"], magic: [0x00, 0x01, 0x00, 0x00, 0x00] },
];

function matches(bytes: Uint8Array, signature: Signature): boolean {
  const offset = signature.offset ?? 0;
  if (bytes.length < offset + signature.magic.length) return false;
  for (let i = 0; i < signature.magic.length; i++) {
    const expected = signature.magic[i];
    if (expected === null) continue;
    if (bytes[offset + i] !== expected) return false;
  }
  return true;
}

export interface DetectedType {
  label: string;
  mime: string;
  extensions: string[];
}

/** The first signature the bytes match, or null when nothing does. */
export function detectFileType(bytes: Uint8Array): DetectedType | null {
  for (const signature of SIGNATURES) {
    if (matches(bytes, signature)) {
      return { label: signature.label, mime: signature.mime, extensions: signature.extensions };
    }
  }
  return null;
}

/** True when the bytes look like text rather than binary. */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  const sample = bytes.subarray(0, 512);
  let suspicious = 0;
  for (const byte of sample) {
    // NUL never appears in text; other control bytes outside tab/CR/LF/FF are
    // strong evidence of a binary file.
    if (byte === 0) return false;
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) suspicious++;
  }
  return suspicious / sample.length < 0.05;
}

/** The first `count` bytes as a hex dump, for the "what is this really" case. */
export function hexPreview(bytes: Uint8Array, count = 16): string {
  return [...bytes.subarray(0, count)]
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

/** Whether the extension on the name agrees with what the bytes say. */
export function extensionMatches(filename: string, detected: DetectedType | null): boolean | null {
  if (!detected || detected.extensions.length === 0) return null;
  const extension = filename.toLowerCase().split(".").pop() ?? "";
  if (!extension || extension === filename.toLowerCase()) return null;
  return detected.extensions.includes(extension);
}
