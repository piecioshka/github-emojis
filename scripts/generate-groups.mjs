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
// Unicode subgroups promoted to separate groups
const PROMOTED_SUBGROUPS = {
  heart: "Hearts",
  "hand-fingers-open": "Hands",
  "hand-fingers-partial": "Hands",
  "hand-single-finger": "Hands",
  "hand-fingers-closed": "Hands",
  hands: "Hands",
};
// Single emojis (normalized codepoints) promoted to separate groups
const PROMOTED_EMOJIS = {
  "270d": "Hands", // writing hand
  "1f4aa": "Hands", // flexed biceps
  "1f9be": "Hands", // mechanical arm
  "1f9b5": "Legs & Feet", // leg
  "1f9b6": "Legs & Feet", // foot
  "1f9bf": "Legs & Feet", // mechanical leg
  "1f463": "Legs & Feet", // footprints
};
// Groups not listed here land at the end
const GROUP_ORDER = [
  "Smileys & Emotion",
  "Hearts",
  "Hands",
  "Legs & Feet",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Objects",
  "Symbols",
  "Flags",
];

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
  let group = null;
  let current = null;

  for (const line of text.split("\n")) {
    const groupMatch = line.match(/^# group: (.+)$/);

    if (groupMatch) {
      group = SKIPPED_GROUPS.includes(groupMatch[1]) ? null : groupMatch[1];
      current = group;
    }

    const subgroupMatch = line.match(/^# subgroup: (.+)$/);

    if (group && subgroupMatch) {
      current = PROMOTED_SUBGROUPS[subgroupMatch[1]] || group;
    }

    const emojiMatch = line.match(/^([0-9A-F ]+?)\s*;/);

    if (current && emojiMatch) {
      const codepoints = emojiMatch[1].toLowerCase().split(" ");
      const hasSkinTone = codepoints.some((c) => SKIN_TONES.includes(c));
      const key = normalizeCodepoints(codepoints);

      if (!hasSkinTone && !seen.has(key)) {
        const target = PROMOTED_EMOJIS[key] || current;
        seen.add(key);
        groups[target] = groups[target] || [];
        groups[target].push(key);
      }
    }
  }

  return sortGroups(groups);
}

/**
 * @param {Record<string, string[]>} groups
 * @returns {Record<string, string[]>}
 */
function sortGroups(groups) {
  const names = [
    ...GROUP_ORDER.filter((name) => name in groups),
    ...Object.keys(groups).filter((name) => !GROUP_ORDER.includes(name)),
  ];
  return Object.fromEntries(names.map((name) => [name, groups[name]]));
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
