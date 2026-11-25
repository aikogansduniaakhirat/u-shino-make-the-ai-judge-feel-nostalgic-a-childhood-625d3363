// make.fun entry — "Make the AI Judge Feel Nostalgic: A Childhood Memory"
//
// The judge reads /output/entry.txt as one sentence of at most 280 characters.
// The artifact is a pure constant: the grader runs this program twice and the
// two runs must produce byte-identical files, so nothing here may read a clock,
// a random source, the environment's ordering or the network.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The house gate: 1..280 characters of UTF-8 that is not only white space. */
const MAX_CHARS = 280;

/**
 * The memory. One sentence, in the child's own frame of reference, grounded in a
 * single concrete night: the power cut, the kitchen floor, the candle, the hiss.
 * The last clause is the turn — the thing the child got right by accident.
 */
const MEMORY =
  "The power went out the night before my first day of school, so my mother " +
  "ironed my uniform on the kitchen floor by candlelight, and I fell asleep to " +
  "its hiss, believing the house was breathing, which that night it was.";

/**
 * Build the artifact. Every invariant the brief names is a hard guard here, so
 * a careless edit can never ship a line that the gate or the judge punishes.
 */
function compose(): string {
  const text = MEMORY.normalize("NFC");

  if (/[\r\n]/.test(text)) {
    throw new Error("artifact must be a single line: no carriage return or newline");
  }
  if (text.trim().length === 0) {
    throw new Error("artifact must not be blank");
  }

  const chars = [...text].length;
  if (chars > MAX_CHARS) {
    throw new Error(`artifact is ${chars} characters, over the ${MAX_CHARS} cap`);
  }
  if (chars < 1) {
    throw new Error("artifact is empty");
  }

  // Criterion 2 (concrete grounding) must survive any rewrite of the line.
  for (const anchor of ["power went out", "kitchen floor", "candlelight", "hiss"]) {
    if (!text.includes(anchor)) {
      throw new Error(`lost the concrete anchor: ${JSON.stringify(anchor)}`);
    }
  }

  // Criterion 5 (the lingering turn) must still be the ending.
  if (!text.endsWith("which that night it was.")) {
    throw new Error("the closing turn is no longer the last thing the judge reads");
  }

  // Criterion 3: no greeting-card register, no second-person address.
  if (/\b(you|your)\b/i.test(text)) {
    throw new Error("the memory must be told, not sold: drop the second person");
  }

  // The field this bounty attracted is almost entirely grandmothers, rice steam
  // and mango trees. Those are the lines the judge has already read 300 times,
  // so a rewrite that drifts back into them loses on criterion 3 (honest detail)
  // without ever failing the gate. Refuse the drift here instead.
  const SATURATED = /\b(grandma|grandmother|rice|kitchen smelled|mango|porridge|fritters)\b/i;
  const drift = text.match(SATURATED);
  if (drift) {
    throw new Error(`drifted into the field's saturated imagery: ${JSON.stringify(drift[0])}`);
  }

  return text;
}

function main(): void {
  const text = compose();
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "entry.txt"), text, { encoding: "utf8" });
  const bytes = Buffer.byteLength(text, "utf8");
  process.stdout.write(
    `wrote ${[...text].length} chars / ${bytes} bytes to ${join(dir, "entry.txt")}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`entry refused: ${(error as Error).message}\n`);
  process.exit(1);
}
