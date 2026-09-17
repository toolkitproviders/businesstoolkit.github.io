import type { Tool } from "@/lib/tool-types";

/**
 * Image tools. Each decodes with createImageBitmap and re-encodes through
 * canvas on the device, so no picture is ever uploaded.
 */
export const imageTools: Tool[] = [
  {
    slug: "image-converter",
    name: "Image Converter",
    tagline: "Convert between JPG, PNG, WebP and AVIF.",
    description:
      "Convert any image to JPG, PNG, WebP or AVIF, in batches, with a quality slider and a background colour for the formats that cannot store transparency.",
    category: "images",
    icon: "images",
    keywords: [
      "image converter", "convert image format", "jpg png webp converter",
      "avif converter", "bulk image conversion", "change image format",
    ],
    seoTitle: "Image Converter — JPG, PNG, WebP and AVIF, In Bulk",
    seoDescription:
      "Convert images between JPG, PNG, WebP and AVIF in your browser, in batches, with quality control. Nothing is uploaded to a server.",
    faq: [
      {
        q: "Which format should I use?",
        a: "WebP for the web — it is 25–35% smaller than JPG at the same quality and every current browser reads it. PNG when you need transparency or exact pixels. JPG when something old has to open it.",
      },
      {
        q: "Why is AVIF sometimes unavailable?",
        a: "Encoding happens in your browser, and not every browser can write AVIF. The tool checks before converting and tells you rather than silently handing back a PNG.",
      },
      {
        q: "Are my images uploaded?",
        a: "No. They are decoded and re-encoded on your own device. Do not upload images to a server — with this tool you do not have to.",
      },
    ],
    related: ["image-to-webp-converter", "image-compressor", "image-resizer", "image-dimensions-checker"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "jpg-to-png-converter",
    name: "JPG to PNG Converter",
    tagline: "Turn JPGs into lossless PNGs.",
    description:
      "Convert one JPG or a whole batch into PNG in your browser, with a ZIP download when there is more than one.",
    category: "images",
    icon: "file-image",
    keywords: [
      "jpg to png", "jpeg to png", "convert jpg to png",
      "jpg png converter", "change jpg to png", "batch jpg to png",
    ],
    seoTitle: "JPG to PNG Converter — Free, Batch, In Your Browser",
    seoDescription:
      "Convert JPG images to PNG in your browser, one at a time or in bulk with a ZIP download. Free, no signup, and nothing is uploaded.",
    faq: [
      {
        q: "Will converting to PNG improve the quality?",
        a: "No. JPG throws away detail when it compresses, and that detail cannot come back. PNG will preserve exactly what is in the JPG — no better, no worse.",
      },
      {
        q: "Why is the PNG so much bigger?",
        a: "PNG is lossless, so it stores every pixel. On a photograph that routinely means three to five times the size of the JPG. That is expected, not a fault.",
      },
      {
        q: "When is this actually worth doing?",
        a: "When something downstream needs PNG — a print workflow, a logo that must not degrade further, or software that refuses JPG.",
      },
    ],
    related: ["png-to-jpg-converter", "image-converter", "image-compressor", "image-to-webp-converter"],
    privateByDefault: true,
  },
  {
    slug: "png-to-jpg-converter",
    name: "PNG to JPG Converter",
    tagline: "Shrink PNGs by converting them to JPG.",
    description:
      "Convert PNG images to JPG with a quality slider and a choice of background colour, since JPG cannot store transparency.",
    category: "images",
    icon: "file-image",
    keywords: [
      "png to jpg", "png to jpeg", "convert png to jpg",
      "png jpg converter", "reduce png size", "batch png to jpg",
    ],
    seoTitle: "PNG to JPG Converter — Free and Batch, In Your Browser",
    seoDescription:
      "Convert PNG to JPG with quality control and a background colour for transparent areas. Batch conversion with ZIP download, nothing uploaded.",
    faq: [
      {
        q: "What happens to transparent areas?",
        a: "JPG has no alpha channel, so anything transparent is painted onto the background colour you choose. White is the usual answer; pick the colour of the page it will sit on.",
      },
      {
        q: "How much smaller will the JPG be?",
        a: "For a photograph saved as PNG, usually 70–90% smaller. For a logo or screenshot with flat colour, PNG is often the smaller format — check before you switch.",
      },
      {
        q: "What quality setting should I use?",
        a: "85–92% is indistinguishable from the original for almost everyone. Below about 75% you start to see blocking around edges and text.",
      },
    ],
    related: ["jpg-to-png-converter", "image-compressor", "image-converter", "image-to-webp-converter"],
    privateByDefault: true,
  },
  {
    slug: "webp-converter",
    name: "WebP to PNG & JPG Converter",
    tagline: "Open WebP files in software that cannot read them.",
    description:
      "Convert WebP images to PNG or JPG so they open in older software, print workflows and applications that never added WebP support.",
    category: "images",
    icon: "file-image",
    keywords: [
      "webp to png", "webp to jpg", "convert webp", "open webp file",
      "webp converter", "webp to jpeg",
    ],
    seoTitle: "WebP Converter — Turn WebP Into PNG or JPG",
    seoDescription:
      "Convert WebP images to PNG or JPG in your browser so they open anywhere. Batch conversion with a ZIP download, and nothing is uploaded.",
    faq: [
      {
        q: "Why will nothing open my WebP file?",
        a: "WebP is well supported in browsers but much less so in desktop software, older versions of Office and some print workflows. Converting to PNG or JPG fixes it.",
      },
      {
        q: "Which should I convert to?",
        a: "PNG if the image has transparency or sharp edges such as a logo or screenshot. JPG if it is a photograph and size matters.",
      },
    ],
    related: ["image-to-webp-converter", "image-converter", "png-to-jpg-converter", "image-compressor"],
    privateByDefault: true,
  },
  {
    slug: "image-to-webp-converter",
    name: "Image to WebP Converter",
    tagline: "Cut image weight by a third with WebP.",
    description:
      "Convert JPG, PNG and other images to WebP, the format that is typically 25–35% smaller than JPG at the same visual quality.",
    category: "images",
    icon: "images",
    keywords: [
      "image to webp", "jpg to webp", "png to webp", "convert to webp",
      "webp converter", "reduce image size web",
    ],
    seoTitle: "Image to WebP Converter — Smaller Images for the Web",
    seoDescription:
      "Convert JPG, PNG and other images to WebP in your browser and cut page weight by roughly a third. Batch conversion, nothing uploaded.",
    faq: [
      {
        q: "Is WebP safe to use on a live site?",
        a: "Yes. Every browser in current use supports it, including Safari since 2020. Email clients are the one place worth keeping a JPG fallback.",
      },
      {
        q: "Does WebP keep transparency?",
        a: "Yes, unlike JPG. That makes it a good single replacement for both JPG photographs and PNG graphics.",
      },
      {
        q: "How much smaller will my images get?",
        a: "Typically 25–35% against a JPG of the same visual quality, and often far more against a PNG photograph. The tool shows the before and after totals.",
      },
    ],
    related: ["image-converter", "image-compressor", "webp-converter", "image-resizer"],
    privateByDefault: true,
  },
  {
    slug: "image-cropper",
    name: "Image Cropper",
    tagline: "Drag to crop, with ratio presets and exact pixels.",
    description:
      "Crop an image by dragging a selection, lock it to a common aspect ratio, and fine-tune the exact pixel values before downloading.",
    category: "images",
    icon: "crop",
    keywords: [
      "image cropper", "crop image online", "crop photo", "crop jpg",
      "crop png", "square crop", "16:9 crop", "free image crop",
    ],
    seoTitle: "Image Cropper — Crop Photos Online, Free and Private",
    seoDescription:
      "Crop an image by dragging, with 1:1, 4:3, 16:9 and other ratio presets and exact pixel controls. Your file is processed locally in your browser.",
    faq: [
      {
        q: "How do I crop to an exact size?",
        a: "Drag a rough selection, then type the exact X, Y, width and height into the boxes. They are in real image pixels, not screen pixels.",
      },
      {
        q: "Does cropping reduce the quality?",
        a: "Cropping itself only removes pixels. Saving as PNG keeps what remains exactly; JPG and WebP re-compress, so PNG is the safe choice if the image will be edited again.",
      },
      {
        q: "Can I crop to a ratio for Instagram or YouTube?",
        a: "Yes — 1:1 for a square post, 9:16 for a story or reel, 16:9 for a YouTube thumbnail. Pick the ratio and the selection stays locked to it.",
      },
    ],
    related: ["image-resizer", "social-media-image-resizer", "image-compressor", "image-dimensions-checker"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "image-to-base64",
    name: "Image to Base64 Converter",
    tagline: "Data URIs both ways, with a preview.",
    description:
      "Turn an image into a data URI for inlining in CSS or HTML, or paste a data URI back and get the image file — with a preview and a size warning either way.",
    category: "images",
    icon: "scan-line",
    keywords: [
      "image to base64", "base64 to image", "data uri image",
      "base64 encode image", "inline image css", "decode base64 image",
    ],
    seoTitle: "Image to Base64 Converter — Data URIs Both Ways",
    seoDescription:
      "Convert an image to a Base64 data URI for CSS or HTML, or decode one back to a file, with a live preview. Processed entirely in your browser.",
    faq: [
      {
        q: "When should I inline an image as Base64?",
        a: "For tiny assets — an icon, a 1 px gradient, an image in an HTML email. Above roughly 10 KB the extra bytes and the loss of separate caching cost more than the saved request.",
      },
      {
        q: "Why is the Base64 bigger than the file?",
        a: "Base64 represents three bytes as four characters, so everything grows by about a third. It is an encoding, not compression.",
      },
      {
        q: "Can I paste any data URI in?",
        a: "Only ones that declare an image type, and the result has to decode as a real image. Anything else is rejected rather than rendered.",
      },
    ],
    related: ["base64-encoder-decoder", "image-converter", "image-compressor", "css-formatter"],
    privateByDefault: true,
  },
  {
    slug: "image-dimensions-checker",
    name: "Image Dimensions Checker",
    tagline: "Exact pixel size, ratio and file size for any image.",
    description:
      "Check the true pixel dimensions, aspect ratio, megapixels and file size of one image or a whole folder, with a warning when a file is barely compressed.",
    category: "images",
    icon: "scan-line",
    keywords: [
      "image dimensions", "check image size", "image size checker",
      "photo dimensions", "aspect ratio checker", "image file size",
      "pixel dimensions",
    ],
    seoTitle: "Image Dimensions Checker — Size, Ratio and Megapixels",
    seoDescription:
      "Check the exact pixel dimensions, aspect ratio, megapixels and file size of any image, one at a time or in bulk. Nothing is uploaded.",
    faq: [
      {
        q: "Why does this differ from what my computer shows?",
        a: "It decodes the image rather than reading metadata, so it reports the real pixel grid. Some formats carry a stale size in their metadata; the decoded value is the one browsers actually use.",
      },
      {
        q: "What does bytes per pixel tell me?",
        a: "Roughly how hard the file has been compressed. Above about 3 the image is barely compressed and will shrink a lot with no visible change; below 0.3 it has been squeezed hard.",
      },
      {
        q: "How large should a web image be?",
        a: "Rarely more than 1600–2000 pixels wide. Anything beyond that is downscaled by the browser anyway, so the extra bytes buy nothing.",
      },
    ],
    related: ["image-resizer", "image-compressor", "image-cropper", "file-information-viewer"],
    privateByDefault: true,
  },
];
