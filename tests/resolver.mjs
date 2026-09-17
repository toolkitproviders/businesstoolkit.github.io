/**
 * Maps the `@/` TypeScript path alias to `src/` and appends the `.ts`/`.tsx`
 * extension that TypeScript-style imports omit, so the Node-based logic tests
 * can import the application's real modules without a build step.
 */
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

const SRC = pathToFileURL(resolvePath(process.cwd(), "src") + "/").href;

function withExtension(url) {
  if (/\.(ts|tsx|mjs|js|json)$/.test(url)) return url;
  for (const candidate of [`${url}.ts`, `${url}.tsx`, `${url}/index.ts`, `${url}/index.tsx`]) {
    if (existsSync(fileURLToPath(candidate))) return candidate;
  }
  return url;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(withExtension(SRC + specifier.slice(2)), context);
    }
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      try {
        const base = context.parentURL ?? pathToFileURL(process.cwd() + "/").href;
        return nextResolve(withExtension(new URL(specifier, base).href), context);
      } catch {
        // Fall through to the default resolver.
      }
    }
    return nextResolve(specifier, context);
  },
});
