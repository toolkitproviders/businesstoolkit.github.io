"use client";

import { Alert } from "@/components/ui";
import { TextTool } from "./framework";
import { TEXT_TOOL_DEFS } from "./defs";

/**
 * Renders whichever text-tool definition matches the slug. One client
 * component serves every text, encoding and formatting tool on the site.
 */
export function TextToolPage({ toolSlug }: { toolSlug: string }) {
  const def = TEXT_TOOL_DEFS[toolSlug];

  if (!def) {
    return (
      <Alert tone="error" title="Tool unavailable">
        This tool is not configured. Please let us know which tool you were trying to use.
      </Alert>
    );
  }

  return <TextTool def={def} toolSlug={toolSlug} />;
}
