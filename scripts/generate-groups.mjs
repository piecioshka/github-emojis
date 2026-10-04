// Generates data/groups.json (Unicode group -> list of emoji codepoints)
// from the official Unicode emoji-test.txt file.
//
// Usage: node scripts/generate-groups.mjs

import { writeFile, mkdir } from "node:fs/promises";

const SOURCE_URL = "https://unicode.org/Public/emoji/latest/emoji-test.txt";
const OUTPUT_FILE = new URL("../data/groups.json", import.meta.url);
const IGNORED_CODEPOINTS = ["fe0f", "200d"];
const SKIN_TONES = ["1f3fb", "1f3fc", "1f3fd", "1f3fe", "1f3ff"];
const SKIPPED_GROUPS = ["Component"];

/**
 * Keep in sync with normalizeCodepoints() in scripts/main.js
 *
 * @param {string[]} codepoints
 * @returns {string}
 */
function normalizeCodepoints(codepoints) {
  return codepoints
    .map((codepoint) => codepoint.toLowerCase().replace(/^0+/, ""))
    .filter((codepoint) => !IGNORED_CODEPOINTS.includes(codepoint))
    .join("-");
}

/**
 * @param {string} text
 * @returns {Record<string, string[]>}
 */
function parseGroups(text) {
  const groups = {};
  const seen = new Set();
  let current = null;

  for (const line of text.split("\n")) {
    const groupMatch = line.match(/^# group: (.+)$/);

    if (groupMatch) {
      current = SKIPPED_GROUPS.includes(groupMatch[1]) ? null : groupMatch[1];
    }

    const emojiMatch = line.match(/^([0-9A-F ]+?)\s*;/);

    if (current && emojiMatch) {
      const codepoints = emojiMatch[1].toLowerCase().split(" ");
      const hasSkinTone = codepoints.some((c) => SKIN_TONES.includes(c));
      const key = normalizeCodepoints(codepoints);

      if (!hasSkinTone && !seen.has(key)) {
        seen.add(key);
        groups[current] = groups[current] || [];
        groups[current].push(key);
      }
    }
  }

  return groups;
}

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(`Cannot fetch ${SOURCE_URL}: HTTP ${response.status}`);
}

const groups = parseGroups(await response.text());
await mkdir(new URL("./", OUTPUT_FILE), { recursive: true });
await writeFile(OUTPUT_FILE, JSON.stringify(groups) + "\n");

for (const [name, codepoints] of Object.entries(groups)) {
  console.log(`${name}: ${codepoints.length}`);
}
