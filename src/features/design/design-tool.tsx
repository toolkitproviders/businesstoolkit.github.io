"use client";

import { Alert } from "@/components/ui";
import { DesignTool } from "./framework";
import { DESIGN_TOOL_DEFS } from "./defs";

/**
 * Renders whichever design definition matches the slug. One client component
 * serves every colour and CSS tool on the site.
 */
export function DesignToolPage({ toolSlug }: { toolSlug: string }) {
  const def = DESIGN_TOOL_DEFS[toolSlug];

  if (!def) {
    return (
      <Alert tone="error" title="Tool unavailable">
        This tool is not configured. Please let us know which tool you were trying to use.
      </Alert>
    );
  }

  return <DesignTool def={def} toolSlug={toolSlug} />;
}
