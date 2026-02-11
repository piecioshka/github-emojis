async function fetchEmojies() {
  const response = await fetch("https://api.github.com/emojis");
  const data = await response.json();
  return data;
}

function hideLoader() {
  const loader = document.querySelector(".loader");
  loader?.remove();
}

function clearEmojies() {
  const outlet = document.querySelector(".github-emojies");
  if (!outlet) {
    throw new Error("Element with class 'github-emojies' not found");
  }

  while (outlet.firstChild) {
    outlet.removeChild(outlet.firstChild);
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
  const outlet = document.querySelector(".github-emojies");
  if (!outlet) {
    throw new Error("Element with class 'github-emojies' not found");
  }

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
  outlet.appendChild(table);
}

function renderEmojiesGrid(data) {
  const outlet = document.querySelector(".github-emojies");
  if (!outlet) {
    throw new Error("Element with class 'github-emojies' not found");
  }

  const list = document.createElement("ul");

  for (const [name, url] of Object.entries(data)) {
    const item = document.createElement("li");
    const emoji = renderEmoji(url, name);
    item.appendChild(emoji);
    list.appendChild(item);
  }

  outlet.appendChild(list);
}

function renderEmptyState() {
  const outlet = document.querySelector(".github-emojies");
  const message = document.createElement("p");
  message.textContent = "No emojies found.";
  outlet.appendChild(message);
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

function getLayout() {
  return localStorage.getItem("layout") || "grid";
}

async function main() {
  const data = await fetchEmojies();
  hideLoader();

  const listButton = document.querySelector(".view-list");
  const gridButton = document.querySelector(".view-grid");
  const filterInput = document.querySelector("#emoji-filter");

  function renderView(type) {
    const query = filterInput.value.trim().replace(/:/g, "").toLowerCase();
    const filteredData = filterEmojies(data, query);

    clearEmojies();

    if (Object.keys(filteredData).length === 0) {
      renderEmptyState();
      return;
    }

    if (type === "grid") {
      renderEmojiesGrid(filteredData);
      localStorage.setItem("layout", "grid");
      gridButton.classList.add("active");
      listButton.classList.remove("active");
    } else {
      renderEmojiesList(filteredData);
      localStorage.setItem("layout", "list");
      listButton.classList.add("active");
      gridButton.classList.remove("active");
    }
  }

  renderView(getLayout());

  listButton.addEventListener("click", () => {
    renderView("list");
  });

  gridButton.addEventListener("click", () => {
    renderView("grid");
  });

  filterInput.addEventListener("input", () => {
    renderView(getLayout());
  });
}

Docsify.dom.documentReady(main);
