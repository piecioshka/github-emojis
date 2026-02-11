async function fetchEmojies() {
  const response = await fetch("https://api.github.com/emojis");
  return await response.json();
}

function showLoader() {
  const loader = document.createElement("p");
  loader.classList.add("loader");
  loader.textContent = "Loading emojies...";
  const $controls = document.querySelector("#controls");
  $controls?.appendChild(loader);
}

function hideLoader() {
  const loader = document.querySelector(".loader");
  loader?.remove();
}

function clearEmojies() {
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

function renderEmojiesList(data) {
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

function renderEmojiesGrid(data) {
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
  message.textContent = "No emojies found.";
  $outlet?.appendChild(message);
}

function filterEmojies(data, query) {
  const filtered = {};
  for (const [name, url] of Object.entries(data)) {
    if (name.includes(query)) {
      filtered[name] = url;
    }
  }
  return filtered;
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
  container.innerHTML = `<em>Status: ${count} emojies loaded.</em>`;
  const $status = document.querySelector("#status");
  $status?.appendChild(container);
}

async function main() {
  console.log("App started");
  renderLayoutButtons();
  renderFilterInput();
  showLoader();

  const data = await fetchEmojies();
  hideLoader();

  const listButton = document.querySelector(".view-list");
  const gridButton = document.querySelector(".view-grid");
  const filterInput = document.querySelector("#emoji-filter");

  /**
   * @param {string} type
   */
  function renderView(type) {
    const query = filterInput?.value.trim().replace(/:/g, "").toLowerCase();
    const filteredData = filterEmojies(data, query);

    clearEmojies();
    clearStatus();

    if (Object.keys(filteredData).length === 0) {
      renderEmptyState();
      return;
    }

    if (type === "grid") {
      renderEmojiesGrid(filteredData);
      localStorage.setItem("layout", "grid");
      gridButton?.classList.add("active");
      listButton?.classList.remove("active");
    } else {
      renderEmojiesList(filteredData);
      localStorage.setItem("layout", "list");
      listButton?.classList.add("active");
      gridButton?.classList.remove("active");
    }

    renderStatus(Object.keys(filteredData).length);
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
