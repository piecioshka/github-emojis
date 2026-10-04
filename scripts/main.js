const GROUP_ALL = "All";
const GROUP_CUSTOM = "GitHub Custom";
const GROUP_OTHER = "Other";
const IGNORED_CODEPOINTS = ["fe0f", "200d"];

async function fetchEmojis() {
  const response = await fetch("https://api.github.com/emojis");
  return await response.json();
}

/**
 * @returns {Promise<Record<string, string[]>>} Unicode group -> codepoints
 */
async function fetchGroups() {
  try {
    const response = await fetch("data/groups.json");
    return await response.json();
  } catch (error) {
    console.error("Cannot load emoji groups", error);
    return {};
  }
}

function showLoader() {
  const loader = document.createElement("p");
  loader.classList.add("loader");
  loader.textContent = "Loading emojis...";
  const $controls = document.querySelector("#controls");
  $controls?.appendChild(loader);
}

function hideLoader() {
  const loader = document.querySelector(".loader");
  loader?.remove();
}

function clearEmojis() {
  const $outlet = document.querySelector("#outlet");

  while ($outlet?.firstChild) {
    $outlet.removeChild($outlet.firstChild);
  }
}

function renderEmoji(url, name) {
  const button = document.createElement("button");
  button.title = `Click to copy :${name}:`;
  button.classList.add("emoji-button");
  const img = document.createElement("img");
  img.src = url;
  img.alt = name;
  img.classList.add("emoji-icon");
  button.addEventListener("click", () => {
    navigator.clipboard.writeText(`:${name}:`);
  });
  button.appendChild(img);
  return button;
}

function renderGroupHeading(group, count) {
  const $outlet = document.querySelector("#outlet");
  const heading = document.createElement("h3");
  heading.classList.add("group-heading");
  heading.textContent = `${group} (${count})`;
  $outlet?.appendChild(heading);
}

function renderEmojisList(data) {
  const $outlet = document.querySelector("#outlet");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  tr.innerHTML = "<th>Emoji</th><th>Name</th>";
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const [name, url] of Object.entries(data)) {
    const row = document.createElement("tr");

    const emojiCell = document.createElement("td");
    emojiCell.appendChild(renderEmoji(url, name));
    row.appendChild(emojiCell);

    const nameCell = document.createElement("td");
    nameCell.appendChild(document.createTextNode(`:${name}:`));
    row.appendChild(nameCell);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  $outlet?.appendChild(table);
}

function renderEmojisGrid(data) {
  const $outlet = document.querySelector("#outlet");
  const list = document.createElement("ul");

  for (const [name, url] of Object.entries(data)) {
    const item = document.createElement("li");
    const emoji = renderEmoji(url, name);
    item.appendChild(emoji);
    list.appendChild(item);
  }

  $outlet?.appendChild(list);
}

function renderEmptyState() {
  const $outlet = document.querySelector("#outlet");
  const message = document.createElement("p");
  message.textContent = "No emojis found.";
  $outlet?.appendChild(message);
}

function filterEmojis(data, query) {
  const filtered = {};
  for (const [name, url] of Object.entries(data)) {
    if (name.includes(query)) {
      filtered[name] = url;
    }
  }
  return filtered;
}

/**
 * Keep in sync with normalizeCodepoints() in scripts/generate-groups.mjs
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
 * @param {Record<string, string[]>} groups
 * @returns {Map<string, string>} codepoints -> Unicode group
 */
function buildGroupLookup(groups) {
  const lookup = new Map();
  for (const [group, list] of Object.entries(groups)) {
    for (const codepoints of list) {
      lookup.set(codepoints, group);
    }
  }
  return lookup;
}

/**
 * @param {string} url
 * @param {Map<string, string>} lookup
 * @returns {string}
 */
function getEmojiGroup(url, lookup) {
  const match = url.match(/\/unicode\/([0-9a-f-]+)\.png/);
  if (!match) {
    return GROUP_CUSTOM;
  }
  const codepoints = normalizeCodepoints(match[1].split("-"));
  return lookup.get(codepoints) || GROUP_OTHER;
}

/**
 * @param {Record<string, string>} data
 * @param {string[]} groupNames
 * @param {Map<string, string>} lookup
 * @returns {Record<string, Record<string, string>>} group -> emojis
 */
function groupEmojis(data, groupNames, lookup) {
  const grouped = {};
  for (const group of groupNames) {
    grouped[group] = {};
  }
  for (const [name, url] of Object.entries(data)) {
    grouped[getEmojiGroup(url, lookup)][name] = url;
  }
  return grouped;
}

function getStoredGroup() {
  return localStorage.getItem("group") || GROUP_ALL;
}

function getStoredLayout() {
  return localStorage.getItem("layout") || "grid";
}

function renderLayoutButtons() {
  const container = document.createElement("p");
  container.classList.add("layout-buttons");
  container.textContent = "Layout: ";

  const gridButton = document.createElement("button");
  gridButton.classList.add("view-mode-button", "view-grid");
  gridButton.textContent = "Grid";
  container.appendChild(gridButton);

  container.appendChild(document.createTextNode(" | "));

  const listButton = document.createElement("button");
  listButton.classList.add("view-mode-button", "view-list");
  listButton.textContent = "List";
  container.appendChild(listButton);

  const $controls = document.querySelector("#controls");
  $controls?.appendChild(container);
}

function renderFilterInput() {
  const container = document.createElement("p");
  container.classList.add("filter-input");
  container.textContent = "Filter: ";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "emoji-filter";
  input.placeholder = "Type name...";
  input.autofocus = true;

  container.appendChild(input);

  const $controls = document.querySelector("#controls");
  $controls?.appendChild(container);
}

function renderGroupButtonsContainer() {
  const container = document.createElement("p");
  container.classList.add("group-buttons");
  const $controls = document.querySelector("#controls");
  $controls?.appendChild(container);
}

/**
 * @param {Record<string, number>} counts group -> number of emojis
 * @param {string} activeGroup
 * @param {(group: string) => void} onSelect
 */
function renderGroupButtons(counts, activeGroup, onSelect) {
  const container = document.querySelector(".group-buttons");
  if (!container) {
    return;
  }
  container.textContent = "Group: ";

  Object.entries(counts).forEach(([group, count], index) => {
    if (index > 0) {
      container.appendChild(document.createTextNode(" | "));
    }
    const button = document.createElement("button");
    button.classList.add("group-button");
    button.classList.toggle("active", group === activeGroup);
    button.textContent = `${group} (${count})`;
    button.disabled = count === 0;
    button.addEventListener("click", () => onSelect(group));
    container.appendChild(button);
  });
}

function clearStatus() {
  const $status = document.querySelector("#status");

  while ($status?.firstChild) {
    $status.removeChild($status.firstChild);
  }
}

/**
 * @param {number} count
 */
function renderStatus(count) {
  const container = document.createElement("p");
  container.classList.add("status");
  container.innerHTML = `<em>Status: ${count} emojis loaded.</em>`;
  const $status = document.querySelector("#status");
  $status?.appendChild(container);
}

async function main() {
  console.log("App started");
  renderLayoutButtons();
  renderFilterInput();
  renderGroupButtonsContainer();
  showLoader();

  const [data, groups] = await Promise.all([fetchEmojis(), fetchGroups()]);
  hideLoader();

  const lookup = buildGroupLookup(groups);
  const allGroupNames = [...Object.keys(groups), GROUP_CUSTOM, GROUP_OTHER];
  const usedGroups = groupEmojis(data, allGroupNames, lookup);
  const groupNames = allGroupNames.filter(
    (group) => Object.keys(usedGroups[group]).length > 0,
  );

  const listButton = document.querySelector(".view-list");
  const gridButton = document.querySelector(".view-grid");
  const filterInput = document.querySelector("#emoji-filter");

  /**
   * @param {string} group
   */
  function selectGroup(group) {
    localStorage.setItem("group", group);
    renderView(getStoredLayout());
  }

  /**
   * @param {string} type
   */
  function renderView(type) {
    const query = filterInput?.value.trim().replace(/:/g, "").toLowerCase();
    const filteredData = filterEmojis(data, query);
    const grouped = groupEmojis(filteredData, groupNames, lookup);
    const storedGroup = getStoredGroup();
    const activeGroup = groupNames.includes(storedGroup)
      ? storedGroup
      : GROUP_ALL;
    const visibleGroups = groupNames.filter(
      (group) =>
        (activeGroup === GROUP_ALL || activeGroup === group) &&
        Object.keys(grouped[group]).length > 0,
    );

    const counts = { [GROUP_ALL]: Object.keys(filteredData).length };
    for (const group of groupNames) {
      counts[group] = Object.keys(grouped[group]).length;
    }

    clearEmojis();
    clearStatus();
    renderGroupButtons(counts, activeGroup, selectGroup);

    localStorage.setItem("layout", type);
    gridButton?.classList.toggle("active", type === "grid");
    listButton?.classList.toggle("active", type !== "grid");

    if (visibleGroups.length === 0) {
      renderEmptyState();
      return;
    }

    for (const group of visibleGroups) {
      renderGroupHeading(group, counts[group]);

      if (type === "grid") {
        renderEmojisGrid(grouped[group]);
      } else {
        renderEmojisList(grouped[group]);
      }
    }

    renderStatus(
      visibleGroups.reduce((total, group) => total + counts[group], 0),
    );
  }

  renderView(getStoredLayout());

  listButton?.addEventListener("click", () => {
    renderView("list");
  });

  gridButton?.addEventListener("click", () => {
    renderView("grid");
  });

  filterInput?.addEventListener("input", () => {
    renderView(getStoredLayout());
  });
}

/**
 * @param {string[]} selectors
 * @returns {boolean}
 */
function isLoaded(selectors) {
  return selectors.every((selector) => document.querySelector(selector));
}

/**
 * @param {Function} callback
 */
function bootstrap(callback) {
  const interval = setInterval(() => {
    if (isLoaded(["#controls", "#outlet"])) {
      console.log("All elements loaded");
      clearInterval(interval);
      callback();
    }
  }, 100);
}

bootstrap(main);
