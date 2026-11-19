const searchControls = document.querySelector("#search-controls");
const search = document.querySelector("#resource-search");
const status = document.querySelector("#search-status");
const resources = [...document.querySelectorAll("#resources > li")];

function filterResources() {
  const query = search.value.trim().toLowerCase();
  let matchCount = 0;

  for (const resource of resources) {
    const matches = resource.textContent.toLowerCase().includes(query);
    resource.hidden = !matches;
    matchCount += Number(matches);
  }

  status.textContent = matchCount === 1 ? "1 resource found" : `${matchCount} resources found`;
}

search.addEventListener("input", filterResources);
filterResources();
searchControls.hidden = false;
