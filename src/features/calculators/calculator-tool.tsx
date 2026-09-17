"use client";

import { Alert } from "@/components/ui";
import { Calculator } from "./framework";
import { CALCULATOR_DEFS } from "./defs";

/**
 * Renders whichever calculator definition matches the slug. One client
 * component serves every calculator on the site.
 */
export function CalculatorTool({ toolSlug }: { toolSlug: string }) {
  const def = CALCULATOR_DEFS[toolSlug];

  if (!def) {
    return (
      <Alert tone="error" title="Calculator unavailable">
        This calculator is not configured. Please let us know which tool you were trying to use.
      </Alert>
    );
  }

  return <Calculator def={def} toolSlug={toolSlug} />;
}
