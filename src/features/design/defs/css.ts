import type { DesignResult, DesignToolDef } from "../types";
import { formatRgb, readableTextColor, rgbToHex, type Rgb } from "../color";

/**
 * CSS generators: gradients, shadows, corners and buttons.
 *
 * Every declaration is assembled from numbers and colours this code has
 * already parsed, so the preview style and the copied CSS are built the same
 * way and cannot disagree — and nothing a visitor types reaches the page as
 * raw CSS.
 */

const withAlpha = (color: Rgb, alpha: number): string =>
  alpha >= 1 ? rgbToHex(color) : formatRgb({ ...color, a: Math.max(0, Math.min(1, alpha)) });

/* -------------------------------------------------------------- gradient -- */

export const gradientGenerator: DesignToolDef = {
  controlsTitle: "Gradient",
  controlsDescription: "Two or three stops, any angle, with the CSS ready to copy.",
  resultTitle: "Your gradient",
  fields: [
    {
      key: "type",
      label: "Type",
      type: "select",
      initial: "linear",
      options: [
        { value: "linear", label: "Linear — a straight sweep" },
        { value: "radial", label: "Radial — out from a point" },
        { value: "conic", label: "Conic — around a point" },
      ],
    },
    {
      key: "angle",
      label: "Angle",
      type: "range",
      initial: "135",
      min: 0,
      max: 360,
      step: "1",
      suffix: "°",
      when: (v) => v.type !== "radial",
    },
    {
      key: "shape",
      label: "Shape",
      type: "select",
      initial: "circle",
      options: [
        { value: "circle", label: "Circle" },
        { value: "ellipse", label: "Ellipse" },
      ],
      when: (v) => v.type === "radial",
    },
    { key: "c1", label: "First colour", type: "color", initial: "#2563eb" },
    { key: "p1", label: "Position", type: "range", initial: "0", min: 0, max: 100, step: "1", suffix: "%" },
    { key: "c2", label: "Second colour", type: "color", initial: "#14b8a6" },
    { key: "p2", label: "Position", type: "range", initial: "100", min: 0, max: 100, step: "1", suffix: "%" },
    { key: "third", label: "Add a third colour", type: "checkbox", initial: "", wide: true },
    { key: "c3", label: "Third colour", type: "color", initial: "#a855f7", when: (v) => Boolean(v.third) },
    {
      key: "p3",
      label: "Position",
      type: "range",
      initial: "50",
      min: 0,
      max: 100,
      step: "1",
      suffix: "%",
      when: (v) => Boolean(v.third),
    },
  ],
  compute: (_values, h) => {
    const type = h.str("type") || "linear";
    const stops: string[] = [
      `${rgbToHex(h.color("c1"))} ${h.num("p1", 0)}%`,
      `${rgbToHex(h.color("c2"))} ${h.num("p2", 100)}%`,
    ];
    if (h.bool("third")) {
      // Keep the stops in ascending order so the gradient reads left to right.
      stops.splice(1, 0, `${rgbToHex(h.color("c3"))} ${h.num("p3", 50)}%`);
      stops.sort((a, b) => Number.parseFloat(a.split(" ")[1]) - Number.parseFloat(b.split(" ")[1]));
    }

    const angle = h.num("angle", 135);
    const background =
      type === "radial"
        ? `radial-gradient(${h.str("shape") || "circle"} at center, ${stops.join(", ")})`
        : type === "conic"
          ? `conic-gradient(from ${angle}deg at center, ${stops.join(", ")})`
          : `linear-gradient(${angle}deg, ${stops.join(", ")})`;

    return {
      preview: {
        kind: "box",
        style: { background, width: "100%", height: "11rem", borderRadius: "0.75rem" },
      },
      code: [
        { label: "CSS", value: `background: ${background};`, extension: "css" },
        {
          label: "With a fallback colour",
          value: `background-color: ${rgbToHex(h.color("c1"))};\nbackground-image: ${background.replace(/^[a-z-]+\(/, (m) => m)};`,
          extension: "css",
        },
      ],
      swatches: [
        { label: "Stop 1", color: rgbToHex(h.color("c1")) },
        ...(h.bool("third") ? [{ label: "Stop 2", color: rgbToHex(h.color("c3")) }] : []),
        { label: h.bool("third") ? "Stop 3" : "Stop 2", color: rgbToHex(h.color("c2")) },
      ],
      note:
        type === "linear"
          ? "0° runs bottom to top, 90° left to right, 180° top to bottom."
          : type === "conic"
            ? "A conic gradient sweeps around the centre, which is how pie charts and colour wheels are drawn in CSS."
            : "A radial gradient spreads outwards from the centre of the element.",
    } satisfies DesignResult;
  },
  notes: [
    { label: "Angle", formula: "0deg points up; angles increase clockwise" },
    { label: "Stops", formula: "colour position%, in ascending order" },
    { label: "Banding", formula: "Add a third stop near the middle", note: "It smooths the transition between distant hues." },
  ],
};

/* ------------------------------------------------------------ box shadow -- */

export const boxShadowGenerator: DesignToolDef = {
  controlsTitle: "Shadow",
  controlsDescription: "Drag the sliders and copy the result.",
  resultTitle: "Your shadow",
  fields: [
    { key: "x", label: "Horizontal offset", type: "range", initial: "0", min: -60, max: 60, step: "1", suffix: "px" },
    { key: "y", label: "Vertical offset", type: "range", initial: "8", min: -60, max: 60, step: "1", suffix: "px" },
    { key: "blur", label: "Blur", type: "range", initial: "24", min: 0, max: 120, step: "1", suffix: "px" },
    { key: "spread", label: "Spread", type: "range", initial: "-4", min: -60, max: 60, step: "1", suffix: "px" },
    { key: "color", label: "Shadow colour", type: "color", initial: "#0f172a" },
    { key: "opacity", label: "Opacity", type: "range", initial: "18", min: 0, max: 100, step: "1", suffix: "%" },
    { key: "inset", label: "Inset — shadow inside the box", type: "checkbox", initial: "", wide: true },
    { key: "bg", label: "Preview background", type: "color", initial: "#ffffff" },
    { key: "radius", label: "Preview corner radius", type: "range", initial: "12", min: 0, max: 60, step: "1", suffix: "px" },
  ],
  compute: (_values, h) => {
    const color = withAlpha(h.color("color"), h.num("opacity", 18) / 100);
    const parts = [
      h.bool("inset") ? "inset" : "",
      `${h.num("x", 0)}px`,
      `${h.num("y", 8)}px`,
      `${h.num("blur", 24)}px`,
      `${h.num("spread", -4)}px`,
      color,
    ].filter(Boolean);
    const shadow = parts.join(" ");

    return {
      preview: {
        kind: "box",
        style: {
          boxShadow: shadow,
          backgroundColor: rgbToHex(h.color("bg")),
          width: "14rem",
          height: "8rem",
          borderRadius: `${h.num("radius", 12)}px`,
        },
      },
      code: [
        { label: "CSS", value: `box-shadow: ${shadow};`, extension: "css" },
        { label: "Tailwind arbitrary value", value: `shadow-[${shadow.replace(/ /g, "_")}]`, extension: "txt" },
      ],
      note: h.bool("inset")
        ? "An inset shadow is drawn inside the element, which is how pressed buttons and input wells are made."
        : "A soft, slightly offset shadow with a negative spread reads as lifted rather than smudged.",
    } satisfies DesignResult;
  },
  notes: [
    { label: "Order", formula: "offset-x  offset-y  blur  spread  colour" },
    { label: "Layering", formula: "Separate several shadows with commas", note: "Two or three soft layers look more natural than one hard one." },
  ],
};

/* --------------------------------------------------------- border radius -- */

export const borderRadiusGenerator: DesignToolDef = {
  controlsTitle: "Corners",
  resultTitle: "Your corners",
  fields: [
    { key: "linked", label: "Use the same radius on every corner", type: "checkbox", initial: "1", wide: true },
    {
      key: "unit",
      label: "Unit",
      type: "select",
      initial: "px",
      options: [
        { value: "px", label: "Pixels" },
        { value: "%", label: "Percent" },
        { value: "rem", label: "Rem" },
      ],
    },
    { key: "all", label: "Radius", type: "range", initial: "12", min: 0, max: 100, step: "1", when: (v) => Boolean(v.linked) },
    { key: "tl", label: "Top left", type: "range", initial: "24", min: 0, max: 100, step: "1", when: (v) => !v.linked },
    { key: "tr", label: "Top right", type: "range", initial: "4", min: 0, max: 100, step: "1", when: (v) => !v.linked },
    { key: "br", label: "Bottom right", type: "range", initial: "24", min: 0, max: 100, step: "1", when: (v) => !v.linked },
    { key: "bl", label: "Bottom left", type: "range", initial: "4", min: 0, max: 100, step: "1", when: (v) => !v.linked },
    { key: "color", label: "Preview colour", type: "color", initial: "#2563eb" },
  ],
  compute: (_values, h) => {
    const unit = h.str("unit") || "px";
    const radius = h.bool("linked")
      ? `${h.num("all", 12)}${unit}`
      : `${h.num("tl", 24)}${unit} ${h.num("tr", 4)}${unit} ${h.num("br", 24)}${unit} ${h.num("bl", 4)}${unit}`;

    return {
      preview: {
        kind: "box",
        style: {
          borderRadius: radius,
          backgroundColor: rgbToHex(h.color("color")),
          width: "14rem",
          height: "9rem",
        },
      },
      code: [{ label: "CSS", value: `border-radius: ${radius};`, extension: "css" }],
      rows: [
        { label: "Shorthand", value: `border-radius: ${radius};` },
        {
          label: "Longhand",
          value: h.bool("linked")
            ? `border-radius: ${radius};`
            : `border-top-left-radius: ${h.num("tl", 24)}${unit}; border-top-right-radius: ${h.num("tr", 4)}${unit}; border-bottom-right-radius: ${h.num("br", 24)}${unit}; border-bottom-left-radius: ${h.num("bl", 4)}${unit};`,
        },
      ],
      note:
        unit === "%"
          ? "Percentages are relative to the element's own width and height, so 50% always gives an ellipse."
          : "The four-value shorthand runs clockwise from the top left.",
    } satisfies DesignResult;
  },
  notes: [
    { label: "Shorthand order", formula: "top-left  top-right  bottom-right  bottom-left" },
    { label: "Pill shape", formula: "border-radius: 9999px", note: "Any value past half the height gives a full pill." },
  ],
};

/* ---------------------------------------------------------------- button -- */

export const buttonGenerator: DesignToolDef = {
  controlsTitle: "Button",
  controlsDescription: "Style it here, then copy the HTML and CSS.",
  resultTitle: "Your button",
  fields: [
    { key: "label", label: "Label", type: "text", initial: "Get started", wide: true },
    { key: "bg", label: "Background", type: "color", initial: "#0a1631" },
    { key: "fg", label: "Text colour", type: "color", initial: "#ffffff" },
    { key: "px", label: "Horizontal padding", type: "range", initial: "20", min: 0, max: 64, step: "1", suffix: "px" },
    { key: "py", label: "Vertical padding", type: "range", initial: "11", min: 0, max: 40, step: "1", suffix: "px" },
    { key: "size", label: "Font size", type: "range", initial: "15", min: 10, max: 28, step: "1", suffix: "px" },
    {
      key: "weight",
      label: "Font weight",
      type: "select",
      initial: "600",
      options: [
        { value: "400", label: "Regular" },
        { value: "500", label: "Medium" },
        { value: "600", label: "Semibold" },
        { value: "700", label: "Bold" },
      ],
    },
    { key: "radius", label: "Corner radius", type: "range", initial: "8", min: 0, max: 40, step: "1", suffix: "px" },
    { key: "borderWidth", label: "Border width", type: "range", initial: "0", min: 0, max: 6, step: "1", suffix: "px" },
    { key: "borderColor", label: "Border colour", type: "color", initial: "#0a1631", when: (v) => h0(v.borderWidth) },
    { key: "shadow", label: "Add a soft shadow", type: "checkbox", initial: "1", wide: true },
    { key: "uppercase", label: "Upper case with letter spacing", type: "checkbox", initial: "", wide: true },
    { key: "full", label: "Full width", type: "checkbox", initial: "", wide: true },
  ],
  compute: (_values, h) => {
    const bg = h.color("bg");
    const fg = h.color("fg");
    const borderWidth = h.num("borderWidth", 0);
    const label = h.str("label") || "Button";

    const declarations: [string, string][] = [
      ["display", h.bool("full") ? "block" : "inline-flex"],
      ["align-items", "center"],
      ["justify-content", "center"],
      ...(h.bool("full") ? ([["width", "100%"]] as [string, string][]) : []),
      ["padding", `${h.num("py", 11)}px ${h.num("px", 20)}px`],
      ["background-color", rgbToHex(bg)],
      ["color", rgbToHex(fg)],
      ["font-size", `${h.num("size", 15)}px`],
      ["font-weight", h.str("weight") || "600"],
      ["line-height", "1.2"],
      ["border", borderWidth > 0 ? `${borderWidth}px solid ${rgbToHex(h.color("borderColor"))}` : "none"],
      ["border-radius", `${h.num("radius", 8)}px`],
      ["cursor", "pointer"],
      ...(h.bool("uppercase")
        ? ([
            ["text-transform", "uppercase"],
            ["letter-spacing", "0.06em"],
          ] as [string, string][])
        : []),
      ...(h.bool("shadow")
        ? ([["box-shadow", `0 1px 2px ${withAlpha(bg, 0.25)}, 0 6px 16px ${withAlpha(bg, 0.18)}`]] as [string, string][])
        : []),
      ["transition", "filter 150ms ease, transform 150ms ease"],
    ];

    const css = `.button {\n${declarations.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n\n.button:hover {\n  filter: brightness(1.08);\n}\n\n.button:active {\n  transform: translateY(1px);\n}`;

    const contrastNote =
      readableTextColor(bg) !== rgbToHex(fg)
        ? "Your text colour is not the most readable option on this background — check it in the Contrast Checker."
        : undefined;

    return {
      preview: {
        kind: "button",
        label,
        style: {
          display: h.bool("full") ? "block" : "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: h.bool("full") ? "100%" : undefined,
          padding: `${h.num("py", 11)}px ${h.num("px", 20)}px`,
          backgroundColor: rgbToHex(bg),
          color: rgbToHex(fg),
          fontSize: `${h.num("size", 15)}px`,
          fontWeight: Number(h.str("weight") || "600"),
          lineHeight: 1.2,
          border: borderWidth > 0 ? `${borderWidth}px solid ${rgbToHex(h.color("borderColor"))}` : "none",
          borderRadius: `${h.num("radius", 8)}px`,
          cursor: "pointer",
          textTransform: h.bool("uppercase") ? "uppercase" : undefined,
          letterSpacing: h.bool("uppercase") ? "0.06em" : undefined,
          boxShadow: h.bool("shadow")
            ? `0 1px 2px ${withAlpha(bg, 0.25)}, 0 6px 16px ${withAlpha(bg, 0.18)}`
            : undefined,
        },
      },
      code: [
        { label: "CSS", value: css, extension: "css" },
        { label: "HTML", value: `<button type="button" class="button">${escapeText(label)}</button>`, extension: "html" },
      ],
      warning: contrastNote,
    } satisfies DesignResult;
  },
  notes: [
    { label: "Tap target", formula: "At least 44 × 44 px", note: "Apple's and Google's guidance, and WCAG 2.5.8." },
    { label: "Hover", formula: "filter: brightness(1.08)", note: "One line, and it works whatever the background colour." },
  ],
};

/** The button label goes into generated HTML, so it is escaped on the way in. */
function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Border colour only matters once there is a border to colour. */
function h0(value: string | undefined): boolean {
  return Number.parseFloat(value ?? "0") > 0;
}
