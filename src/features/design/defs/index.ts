import type { DesignToolDef } from "../types";
import {
  colorConverter,
  colorPaletteGenerator,
  colorPicker,
  colorShadesGenerator,
  contrastChecker,
  randomColorGenerator,
} from "./colors";
import {
  borderRadiusGenerator,
  boxShadowGenerator,
  buttonGenerator,
  gradientGenerator,
} from "./css";

/**
 * Slug → design tool definition. The registry test keeps this in step with the
 * tool catalog in both directions.
 */
export const DESIGN_TOOL_DEFS: Record<string, DesignToolDef> = {
  "color-converter": colorConverter,
  "color-picker": colorPicker,
  "color-palette-generator": colorPaletteGenerator,
  "color-shades-generator": colorShadesGenerator,
  "random-color-generator": randomColorGenerator,
  "contrast-checker": contrastChecker,
  "gradient-generator": gradientGenerator,
  "box-shadow-generator": boxShadowGenerator,
  "border-radius-generator": borderRadiusGenerator,
  "button-generator": buttonGenerator,
};

export const designToolSlugs = Object.keys(DESIGN_TOOL_DEFS);
