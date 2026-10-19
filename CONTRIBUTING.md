# Contributing to GitHub Emojis

How the page is built and how to change it. For what it is, see the [README](README.md) or the [live page](https://piecioshka.github.io/github-emojis/).

## How it works

The site is a [docsify](https://docsify.js.org/) v4 page served by GitHub Pages (`.nojekyll` in the root). `index.html` loads docsify, which renders `README.md`; `scripts/main.js` then fills the `#controls`, `#outlet` and `#status` placeholders from that README:

- the emoji list comes live from the GitHub API (`https://api.github.com/emojis`),
- `data/groups.json` maps Unicode groups to emoji codepoints,
- `data/collections.json` holds hand-picked collections (e.g. Bullets) listed by emoji name.

There is no build step and no `package.json`.

## Running locally

docsify fetches `README.md` over HTTP, so opening `index.html` from disk does not work. Serve the repository root with any static file server and open it in the browser.

## Project structure

| Path                          | What it holds                                                  |
| ----------------------------- | -------------------------------------------------------------- |
| `index.html`                  | docsify setup                                                  |
| `README.md`                   | page content with the placeholders filled by `scripts/main.js` |
| `scripts/main.js`             | fetching emojis, grouping, controls and rendering              |
| `scripts/generate-groups.mjs` | generator of `data/groups.json`                                |
| `styles/main.css`             | page styles                                                    |
| `data/groups.json`            | generated Unicode groups                                       |
| `data/collections.json`       | hand-picked collections                                        |
| `favicon/`, `screenshots/`    | icons and the README screenshot                                |

## Emoji groups

`data/groups.json` is generated from the official Unicode `emoji-test.txt`:

```bash
node scripts/generate-groups.mjs
```

Use the Node.js version from `.nvmrc` (`lts/krypton`). Promoted groups (e.g. Hearts, Hands, Legs & Feet) and the group order are configured at the top of the script; edit the script, not the generated JSON.

To add a collection, add a key with a list of GitHub emoji names to `data/collections.json`.

## CI

`.github/workflows/update-groups.yml` runs the generator at 04:00 UTC on the 1st day of every month (or on manual dispatch) and commits `data/groups.json` as `chore: update emoji groups` when it changed.

## Conventions

- Commits follow Conventional Commits in English (`feat:`, `docs:`, `ci:`, `chore:`).
- Temporary files go to `tmp/` (ignored by git).
