import type { Tool } from "@/lib/tool-types";

/**
 * Colour and CSS tools. All of them run through the shared design engine and
 * do their maths in the browser — nothing is uploaded and no API is called.
 */
export const designTools: Tool[] = [
  {
    slug: "color-converter",
    name: "Color Converter",
    tagline: "HEX, RGB, HSL, HSV and CMYK from one colour.",
    description:
      "Paste a colour in any format and get every other format back, along with its luminance, contrast against black and white, and a strip of lighter and darker versions.",
    category: "design",
    icon: "blend",
    keywords: [
      "color converter", "hex to rgb", "rgb to hex", "hex to hsl",
      "rgb to cmyk", "colour converter", "hsl to hex", "color code converter",
    ],
    seoTitle: "Color Converter — HEX, RGB, HSL, HSV and CMYK",
    seoDescription:
      "Convert a colour between HEX, RGB, HSL, HSV and CMYK, with luminance and contrast figures. Free colour converter that runs in your browser.",
    faq: [
      {
        q: "What formats can I paste in?",
        a: "Hex with three, four, six or eight digits, rgb() and rgba(), hsl() and hsla(), or a CSS colour keyword such as “navy”. Bare hex without the # works too.",
      },
      {
        q: "Should I use HEX or HSL in my CSS?",
        a: "Both compile to the same colour. HSL is easier to adjust by hand — nudge the lightness for a hover state instead of guessing at hex digits.",
      },
      {
        q: "Why is the CMYK slightly off from my print proof?",
        a: "CMYK depends on the ink, paper and profile your printer uses. The conversion here is the standard naive one, which is fine for a rough idea but not for colour-critical print.",
      },
    ],
    related: ["color-picker", "contrast-checker", "color-palette-generator", "color-shades-generator"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    tagline: "Pick from the screen, get every code.",
    description:
      "Choose a colour with your system picker or lift one from anywhere on screen with the pipette, then copy it as hex, RGB or HSL.",
    category: "design",
    icon: "pipette",
    keywords: [
      "color picker", "colour picker", "eyedropper", "pick color from screen",
      "html color picker", "hex color picker", "screen color picker",
    ],
    seoTitle: "Color Picker — Pick Any Colour and Copy Its Code",
    seoDescription:
      "Pick a colour with your system picker or lift one from anywhere on screen with the eyedropper, then copy it as HEX, RGB or HSL.",
    faq: [
      {
        q: "How does the screen pipette work?",
        a: "It uses the browser's EyeDropper API, so the colour is read by the browser itself and nothing is captured or transmitted. Chrome and Edge support it today.",
      },
      {
        q: "Why is there no pipette button in my browser?",
        a: "Safari and Firefox have not shipped the EyeDropper API, so the button is hidden rather than shown broken. The swatch picker works everywhere.",
      },
      {
        q: "What is the “readable text” value?",
        a: "Whichever of black or white has more contrast against your colour — the safe choice for text sitting on top of it.",
      },
    ],
    related: ["color-converter", "contrast-checker", "color-palette-generator", "random-color-generator"],
    privateByDefault: true,
  },
  {
    slug: "color-palette-generator",
    name: "Color Palette Generator",
    tagline: "A whole palette from one colour.",
    description:
      "Pick a base colour and a relationship — complementary, analogous, triadic and more — and get a matching palette with the CSS variables ready to copy.",
    category: "design",
    icon: "palette",
    keywords: [
      "color palette generator", "colour scheme generator", "complementary colors",
      "analogous colors", "triadic colors", "brand colors", "color harmony",
    ],
    seoTitle: "Color Palette Generator — Harmonies From One Colour",
    seoDescription:
      "Generate complementary, analogous, triadic and monochromatic palettes from any base colour, with CSS custom properties ready to copy.",
    faq: [
      {
        q: "Which harmony should I choose?",
        a: "Analogous for something calm and cohesive, complementary when you need one colour to stand out, triadic when you want energy without chaos.",
      },
      {
        q: "How many colours does a brand palette need?",
        a: "Usually one primary, one accent and a neutral scale. Generate the accent here, then use the Shades Generator to build the neutrals.",
      },
      {
        q: "Can I copy the whole palette at once?",
        a: "Yes — the CSS custom properties block holds every colour, or use the plain hex list. Individual swatches copy with a click.",
      },
    ],
    related: ["color-shades-generator", "color-converter", "contrast-checker", "gradient-generator"],
    privateByDefault: true,
  },
  {
    slug: "color-shades-generator",
    name: "Color Shades Generator",
    tagline: "A 50–950 scale from a single colour.",
    description:
      "Turn one colour into a full design-system scale — the 50 to 950 steps that Tailwind and most component libraries expect — or a simple run of tints and shades.",
    category: "design",
    icon: "swatchbook",
    keywords: [
      "color shades generator", "tints and shades", "color scale generator",
      "tailwind color palette", "lighter darker color", "color ramp",
    ],
    seoTitle: "Color Shades Generator — Build a 50–950 Colour Scale",
    seoDescription:
      "Turn one colour into a full 50–950 design-system scale, or a simple run of tints and shades, with CSS and Tailwind theme blocks to copy.",
    faq: [
      {
        q: "What do the numbers mean?",
        a: "They are lightness steps: 50 is the palest, 950 the darkest, and 500 is the colour you entered. Almost every modern design system numbers them this way.",
      },
      {
        q: "What is the difference between a tint and a shade?",
        a: "A tint is the colour mixed towards white; a shade is the colour mixed towards black. The 50–950 scale uses both, meeting at your colour in the middle.",
      },
    ],
    related: ["color-palette-generator", "color-converter", "contrast-checker", "color-picker"],
    privateByDefault: true,
  },
  {
    slug: "random-color-generator",
    name: "Random Color Generator",
    tagline: "Random colours you would actually use.",
    description:
      "Generate a grid of random colours — usable, pastel, dark, greyscale or completely unconstrained — and copy any of them with a click.",
    category: "design",
    icon: "dices",
    keywords: [
      "random color generator", "random colour", "random hex color",
      "pastel color generator", "color inspiration", "random palette",
    ],
    seoTitle: "Random Color Generator — Usable Colours, Instantly",
    seoDescription:
      "Generate random colours in usable, pastel, dark or greyscale ranges and copy any hex with a click. Free and generated in your browser.",
    faq: [
      {
        q: "Why do the default colours look better than pure random?",
        a: "Completely random RGB produces a lot of muddy, unusable colours. The default mode picks a random hue but keeps saturation and lightness in a range that reads well on screen.",
      },
      {
        q: "Are the colours truly random?",
        a: "They come from your browser's cryptographic random number generator, which is as unpredictable as anything available on the device.",
      },
    ],
    related: ["color-palette-generator", "color-picker", "color-converter", "gradient-generator"],
    privateByDefault: true,
  },
  {
    slug: "contrast-checker",
    name: "Contrast Checker",
    tagline: "Check text against its background for WCAG.",
    description:
      "Measure the contrast ratio between a text colour and its background, see which WCAG levels it passes, and get a nearby colour that fixes it when it fails.",
    category: "design",
    icon: "contrast",
    keywords: [
      "contrast checker", "wcag contrast", "color contrast ratio",
      "accessibility contrast", "aa contrast", "text readability", "a11y color",
    ],
    seoTitle: "Contrast Checker — WCAG AA and AAA Colour Testing",
    seoDescription:
      "Check the contrast ratio between two colours against WCAG AA and AAA, see a live preview, and get a nearby passing colour when it fails.",
    faq: [
      {
        q: "What contrast ratio do I need?",
        a: "WCAG AA asks for 4.5:1 on body text and 3:1 on large text and interface elements. AAA raises those to 7:1 and 4.5:1.",
      },
      {
        q: "What counts as large text?",
        a: "18 point and above, or 14 point and above when bold — roughly 24 px and 18.66 px in CSS.",
      },
      {
        q: "Is a passing ratio enough to be accessible?",
        a: "It is necessary, not sufficient. Contrast is one of many criteria; keyboard access, focus states and sensible markup matter just as much.",
      },
    ],
    related: ["color-converter", "color-picker", "color-shades-generator", "button-generator"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "gradient-generator",
    name: "CSS Gradient Generator",
    tagline: "Linear, radial and conic gradients with live preview.",
    description:
      "Build a CSS gradient with two or three stops, any angle and three gradient types, and copy the declaration straight into your stylesheet.",
    category: "design",
    icon: "layers",
    keywords: [
      "css gradient generator", "linear gradient", "radial gradient",
      "conic gradient", "gradient background", "css background generator",
    ],
    seoTitle: "CSS Gradient Generator — Linear, Radial and Conic",
    seoDescription:
      "Build linear, radial and conic CSS gradients with live preview and copy-ready code. Two or three stops, any angle, free and browser-based.",
    faq: [
      {
        q: "Which direction does the angle point?",
        a: "In CSS, 0deg runs bottom to top and angles increase clockwise, so 90deg runs left to right and 180deg top to bottom.",
      },
      {
        q: "Why does my gradient look banded or muddy in the middle?",
        a: "Two distant hues pass through grey as they blend. Add a third stop near the middle in a hue between the two and the transition smooths out.",
      },
      {
        q: "Do I need a fallback colour?",
        a: "Every browser in use supports gradients, but a background-color fallback still helps while the stylesheet loads and in email clients.",
      },
    ],
    related: ["color-palette-generator", "box-shadow-generator", "button-generator", "color-converter"],
    privateByDefault: true,
  },
  {
    slug: "box-shadow-generator",
    name: "Box Shadow Generator",
    tagline: "Dial in a shadow and copy the CSS.",
    description:
      "Adjust offset, blur, spread, colour and opacity with sliders, see the result immediately, and copy the box-shadow declaration or a Tailwind arbitrary value.",
    category: "design",
    icon: "square-dashed",
    keywords: [
      "box shadow generator", "css shadow", "drop shadow css",
      "box-shadow maker", "inset shadow", "tailwind shadow",
    ],
    seoTitle: "Box Shadow Generator — Build CSS Shadows Visually",
    seoDescription:
      "Adjust offset, blur, spread, colour and opacity with live preview, then copy the CSS box-shadow or a Tailwind arbitrary value.",
    faq: [
      {
        q: "What order do the values go in?",
        a: "Horizontal offset, vertical offset, blur, spread, then colour. Add “inset” at the front to draw the shadow inside the element instead.",
      },
      {
        q: "Why do my shadows look heavy?",
        a: "Usually too much opacity and not enough blur. A soft shadow at 10–20% opacity with a negative spread reads as lifted; a dark one reads as a smudge.",
      },
    ],
    related: ["border-radius-generator", "button-generator", "gradient-generator", "color-converter"],
    privateByDefault: true,
  },
  {
    slug: "border-radius-generator",
    name: "Border Radius Generator",
    tagline: "Round every corner, or each one differently.",
    description:
      "Set one radius for the whole element or a different value per corner, in pixels, percent or rem, with a live preview and the CSS to copy.",
    category: "design",
    icon: "square-dashed",
    keywords: [
      "border radius generator", "css rounded corners", "border-radius",
      "rounded corner css", "blob shape generator", "corner radius",
    ],
    seoTitle: "Border Radius Generator — CSS Rounded Corners",
    seoDescription:
      "Set a single radius or four different corners in px, percent or rem, preview it live, and copy the CSS border-radius declaration.",
    faq: [
      {
        q: "What order do the four values go in?",
        a: "Clockwise from the top left: top-left, top-right, bottom-right, bottom-left — the same order as margin and padding shorthand.",
      },
      {
        q: "How do I make a pill or a circle?",
        a: "Any radius past half the element's height gives a pill, so border-radius: 9999px is the usual trick. Use 50% on a square element for a circle.",
      },
    ],
    related: ["box-shadow-generator", "button-generator", "gradient-generator", "color-picker"],
    privateByDefault: true,
  },
  {
    slug: "button-generator",
    name: "CSS Button Generator",
    tagline: "Style a button and copy the HTML and CSS.",
    description:
      "Set colours, padding, type, corners, border and shadow, watch the button update as you go, and copy production-ready HTML and CSS with hover and active states included.",
    category: "design",
    icon: "mouse-pointer-click",
    keywords: [
      "css button generator", "button maker", "html button css",
      "button styles", "css button design", "hover button css",
    ],
    seoTitle: "CSS Button Generator — Design a Button, Copy the Code",
    seoDescription:
      "Style a button visually — colours, padding, type, corners, border and shadow — then copy the HTML and CSS with hover and active states.",
    faq: [
      {
        q: "How big should a button be?",
        a: "At least 44 × 44 pixels for the tappable area. That is Apple's and Google's guidance and it matches WCAG's target-size criterion.",
      },
      {
        q: "Does the generated CSS include a hover state?",
        a: "Yes. It uses a brightness filter, which works on any background colour without you having to pick a second shade by hand, plus a subtle press effect.",
      },
      {
        q: "Will it warn me about unreadable text?",
        a: "Yes. If your text colour is not the more readable option against the background, it says so — check the pair in the Contrast Checker.",
      },
    ],
    related: ["contrast-checker", "box-shadow-generator", "border-radius-generator", "gradient-generator"],
    privateByDefault: true,
  },
];
