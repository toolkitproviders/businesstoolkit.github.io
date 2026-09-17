"use client";

import * as React from "react";
import { Eye, EyeOff, RefreshCw, ShieldCheck } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  SegmentedControl,
  Slider,
  Stat,
} from "@/components/ui";
import { CopyButton, ToolPanel, ToolSplit } from "@/components/tools/shared";
import { BITS_PER_WORD, PASSPHRASE_WORDS } from "./wordlist";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Mode = "random" | "passphrase";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
};

/** Characters people misread when typing a password by hand. */
const AMBIGUOUS = new Set("lI1O0o|`'\"{}[]();:,.".split(""));

/**
 * Uniform random index using rejection sampling.
 *
 * Taking `random % max` would bias toward low indices whenever `max` does not
 * divide the range evenly. Discarding values in the biased tail removes that.
 */
function randomIndex(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Options {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function buildAlphabet(options: Options): { pool: string; groups: string[] } {
  const groups: string[] = [];
  const filter = (set: string) =>
    options.excludeAmbiguous
      ? [...set].filter((c) => !AMBIGUOUS.has(c)).join("")
      : set;

  if (options.lower) groups.push(filter(SETS.lower));
  if (options.upper) groups.push(filter(SETS.upper));
  if (options.numbers) groups.push(filter(SETS.numbers));
  if (options.symbols) groups.push(filter(SETS.symbols));

  const usable = groups.filter((g) => g.length > 0);
  return { pool: usable.join(""), groups: usable };
}

function generatePassword(options: Options): string {
  const { pool, groups } = buildAlphabet(options);
  if (!pool) return "";

  // Guarantee at least one character from every selected group.
  const required = groups
    .slice(0, options.length)
    .map((group) => group[randomIndex(group.length)]);

  const rest = Array.from({ length: Math.max(0, options.length - required.length) }, () =>
    pool[randomIndex(pool.length)],
  );

  return shuffle([...required, ...rest]).join("");
}

function generatePassphrase(words: number, separator: string, capitalise: boolean, addNumber: boolean): string {
  const picked = Array.from({ length: words }, () => {
    const word = PASSPHRASE_WORDS[randomIndex(PASSPHRASE_WORDS.length)];
    return capitalise ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (addNumber) picked.push(String(randomIndex(9000) + 1000));
  return picked.join(separator);
}

/** log2(alphabet^length) — the bits an attacker must search. */
function entropyBits(poolSize: number, length: number): number {
  if (poolSize <= 1 || length <= 0) return 0;
  return Math.log2(poolSize) * length;
}

function strengthOf(bits: number): { label: string; tone: "error" | "warning" | "success"; percent: number } {
  if (bits < 50) return { label: "Weak", tone: "error", percent: (bits / 128) * 100 };
  if (bits < 70) return { label: "Fair", tone: "warning", percent: (bits / 128) * 100 };
  if (bits < 100) return { label: "Strong", tone: "success", percent: (bits / 128) * 100 };
  return { label: "Excellent", tone: "success", percent: 100 };
}

/** Rough time to exhaust the keyspace at 10^12 guesses per second. */
function crackTime(bits: number): string {
  if (bits <= 0) return "instantly";
  const seconds = Math.pow(2, bits - 1) / 1e12;
  if (seconds < 1) return "less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31557600;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`;
  return "longer than the age of the universe";
}

export function PasswordGenerator({ toolSlug }: { toolSlug: string }) {
  const [mode, setMode] = React.useState<Mode>("random");
  const [options, setOptions] = React.useState<Options>({
    length: 20,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [wordCount, setWordCount] = React.useState(6);
  const [separator, setSeparator] = React.useState("-");
  const [capitalise, setCapitalise] = React.useState(true);
  const [addNumber, setAddNumber] = React.useState(true);
  const [password, setPassword] = React.useState("");
  const [batch, setBatch] = React.useState<string[]>([]);
  const [visible, setVisible] = React.useState(true);

  const { pool } = buildAlphabet(options);
  const noSets = pool.length === 0;

  const regenerate = React.useCallback(() => {
    setPassword(
      mode === "random"
        ? generatePassword(options)
        : generatePassphrase(wordCount, separator, capitalise, addNumber),
    );
    setBatch([]);
  }, [mode, options, wordCount, separator, capitalise, addNumber]);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  // Regenerate whenever the settings change — generation is instant.
  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  const bits =
    mode === "random"
      ? entropyBits(pool.length, options.length)
      : // Passphrase entropy comes from the word list, not the rendered characters.
        BITS_PER_WORD * wordCount + (addNumber ? Math.log2(9000) : 0);

  const strength = strengthOf(bits);

  const generateBatch = () => {
    const list = Array.from({ length: 10 }, () =>
      mode === "random"
        ? generatePassword(options)
        : generatePassphrase(wordCount, separator, capitalise, addNumber),
    );
    setBatch(list);
    track("tool_completed", { tool: toolSlug, count: list.length });
  };

  const setOption = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <ToolSplit
      controls={
        <ToolPanel title="Options">
          <SegmentedControl<Mode>
            ariaLabel="Password type"
            value={mode}
            onChange={setMode}
            options={[
              { value: "random", label: "Random characters" },
              { value: "passphrase", label: "Passphrase" },
            ]}
          />

          {mode === "random" ? (
            <>
              <Slider
                label="Length"
                suffix=" characters"
                min={4}
                max={128}
                value={options.length}
                onChange={(e) => setOption("length", Number(e.target.value))}
              />

              <div className="space-y-2.5">
                <Checkbox
                  label="Lowercase letters"
                  description="a b c d e f"
                  checked={options.lower}
                  onChange={(e) => setOption("lower", e.target.checked)}
                />
                <Checkbox
                  label="Uppercase letters"
                  description="A B C D E F"
                  checked={options.upper}
                  onChange={(e) => setOption("upper", e.target.checked)}
                />
                <Checkbox
                  label="Numbers"
                  description="0 1 2 3 4 5"
                  checked={options.numbers}
                  onChange={(e) => setOption("numbers", e.target.checked)}
                />
                <Checkbox
                  label="Symbols"
                  description="! @ # $ % ^ &"
                  checked={options.symbols}
                  onChange={(e) => setOption("symbols", e.target.checked)}
                />
                <Checkbox
                  label="Exclude ambiguous characters"
                  description="Leaves out l, I, 1, O, 0 and similar. Useful if it will be typed by hand."
                  checked={options.excludeAmbiguous}
                  onChange={(e) => setOption("excludeAmbiguous", e.target.checked)}
                />
              </div>

              {noSets && (
                <Alert tone="error">Select at least one character type to generate a password.</Alert>
              )}
            </>
          ) : (
            <>
              <Slider
                label="Words"
                min={3}
                max={12}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
              />
              <Field label="Separator" htmlFor="pw-sep">
                <Input
                  id="pw-sep"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value.slice(0, 3))}
                  maxLength={3}
                  className="font-mono"
                />
              </Field>
              <Checkbox
                label="Capitalise each word"
                checked={capitalise}
                onChange={(e) => setCapitalise(e.target.checked)}
              />
              <Checkbox
                label="Add a number at the end"
                description="Satisfies sites that insist on a digit."
                checked={addNumber}
                onChange={(e) => setAddNumber(e.target.checked)}
              />
              <Alert tone="info">
                Passphrases are far easier to remember and type than random strings. Each word
                adds about {BITS_PER_WORD.toFixed(1)} bits of entropy, so six words plus a number is stronger
                than most hand-picked passwords.
              </Alert>
            </>
          )}
        </ToolPanel>
      }
      result={
        <>
          <ToolPanel title="Your password">
            <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4">
              <p
                className={cn(
                  "break-all font-mono text-lg leading-relaxed",
                  !visible && "select-none blur-sm",
                )}
                aria-live="polite"
              >
                {password || "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <CopyButton value={password} label="Copy password" variant="primary" size="md" />
              <Button variant="outline" onClick={regenerate} disabled={noSets && mode === "random"}>
                <RefreshCw />
                Generate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-medium">Strength</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    strength.tone === "error" && "text-[var(--error)]",
                    strength.tone === "warning" && "text-[var(--warning)]",
                    strength.tone === "success" && "text-[var(--success)]",
                  )}
                >
                  {strength.label}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]"
                role="progressbar"
                aria-valuenow={Math.round(bits)}
                aria-valuemin={0}
                aria-valuemax={128}
                aria-label="Password entropy in bits"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    strength.tone === "error" && "bg-[var(--error)]",
                    strength.tone === "warning" && "bg-[var(--warning)]",
                    strength.tone === "success" && "bg-[var(--success)]",
                  )}
                  style={{ width: `${Math.min(100, Math.max(2, strength.percent))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Entropy"
                value={`${bits.toFixed(1)} bits`}
                sub={mode === "random" ? `${pool.length} possible characters` : `${PASSPHRASE_WORDS.length}-word list`}
              />
              <Stat label="Time to crack" value={crackTime(bits)} sub="At 10¹² guesses/second" />
            </div>

            <Alert tone="success" title="Nothing is stored or transmitted">
              <span className="flex items-start gap-1.5">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Passwords come from your browser&apos;s cryptographic random generator
                (<code className="font-mono text-xs">crypto.getRandomValues</code>). Nothing is sent
                over the network and nothing is written to storage.
              </span>
            </Alert>
          </ToolPanel>

          <ToolPanel
            title="Bulk generation"
            description="Ten at once, for setting up several accounts."
          >
            <Button variant="outline" onClick={generateBatch} className="w-full">
              <RefreshCw />
              Generate 10 passwords
            </Button>

            {batch.length > 0 && (
              <>
                <ul className="space-y-1.5">
                  {batch.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-2"
                    >
                      <code className="min-w-0 flex-1 break-all font-mono text-xs">{item}</code>
                      <CopyButton value={item} label="" size="icon" variant="ghost" />
                    </li>
                  ))}
                </ul>
                <CopyButton
                  value={batch.join("\n")}
                  label="Copy all 10"
                  variant="outline"
                  size="md"
                  className="w-full"
                />
              </>
            )}
          </ToolPanel>
        </>
      }
    />
  );
}
