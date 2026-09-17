/**
 * File-type matching for the uploader.
 *
 * Split out of the component so the rules can be tested directly: getting them
 * wrong silently rejects every file, which is exactly the kind of fault that
 * looks like "the tool is broken" rather than "the rule list is wrong".
 */

/** The minimum of a File the rules actually read. */
export interface FileLike {
  name: string;
  type: string;
}

/** A rule of "*" or "*​/*" means the tool takes any file at all. */
export function acceptsAnything(accept: string[]): boolean {
  return accept.some((rule) => {
    const r = rule.trim();
    return r === "*" || r === "*/*";
  });
}

export function matchesAccept(file: FileLike, accept: string[]): boolean {
  if (accept.length === 0 || acceptsAnything(accept)) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return accept.some((rule) => {
    const r = rule.toLowerCase().trim();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    // An empty type means the OS could not identify the file; an exact MIME
    // rule should not match it, but an extension rule above still can.
    return type !== "" && type === r;
  });
}
