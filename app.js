const storageKey = "campus-safety-reports";
const reportStatus = document.querySelector("#report-status");

/** Loads the reports saved by this browser. */
function loadReports() {
  const reports = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (!Array.isArray(reports)) {
    throw new Error("Invalid report storage");
  }
  return reports;
}

/** Sets up the campus map and report form. */
function initializeMap() {
  if (!window.L) {
    reportStatus.textContent = "The map could not load. Check your connection and reload.";
    return;
  }

  // Start at the Memorial Union
  const map = L.map("map", { doubleClickZoom: false }).setView([44.5650, -123.2789], 16);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const form = document.querySelector("#report-template").content.firstElementChild.cloneNode(true);
  const locationStatus = form.querySelector("#location");
  const descriptionInput = form.querySelector("#description");
  const timeInput = form.querySelector("#occurred-at");
  const saveStatus = form.querySelector("#save-status");

  // Only the pin for the current report can move
  let draftPin;

  function showLocation() {
    const { lat, lng } = draftPin.getLatLng().wrap();
    locationStatus.textContent = `Selected location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  /** Moves the current pin or adds one if there is no draft. */
  function placePin(latLng) {
    if (draftPin) {
      draftPin.setLatLng(latLng);
    } else {
      draftPin = L.marker(latLng, {
        icon: L.divIcon({
          className: "incident-pin",
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
        draggable: true,
        autoPan: true,
        zIndexOffset: 1000,
        alt: "Incident location",
      }).addTo(map)
        .bindPopup(form, { className: "report-popup", minWidth: 210, maxWidth: 280 })
        .on("dragend", showLocation);
    }
    showLocation();
    draftPin.openPopup();
  }

  /** Adds a saved report to the map with its own popup. */
  function showReport(report) {
    const popup = document.createElement("div");
    const time = document.createElement("strong");
    time.textContent = new Date(report.occurredAt).toLocaleString();
    const description = document.createElement("p");
    description.className = "report-description";
    // Use textContent so the description stays plain text in the popup
    description.textContent = report.description;
    popup.append(time, description);

    return L.circleMarker([report.lat, report.lng], {
      radius: 8,
      color: "#101014",
      weight: 2,
      fillColor: "#ff66cc",
      fillOpacity: 1,
    }).addTo(map).bindPopup(popup);
  }

  try {
    for (const report of loadReports()) {
      showReport(report);
    }
  } catch {
    reportStatus.textContent = "Saved reports could not be loaded.";
  }

  map.on("contextmenu", (event) => placePin(event.latlng));
  map.getContainer().addEventListener("keydown", (event) => {
    if (event.target !== map.getContainer() || !event.shiftKey || event.key !== "F10") return;
    event.preventDefault();
    placePin(map.getCenter());
    timeInput.focus();
  });

  descriptionInput.addEventListener("input", () => descriptionInput.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = descriptionInput.value.trim();

    if (!description) {
      descriptionInput.setCustomValidity("Enter a description.");
      descriptionInput.reportValidity();
      return;
    }
    if (!draftPin) return;

    // Read the pin after dragging so we save where it ended up
    const { lat, lng } = draftPin.getLatLng().wrap();
    const report = { lat, lng, description, occurredAt: timeInput.value };
    try {
      const reports = loadReports();
      reports.push(report);
      localStorage.setItem(storageKey, JSON.stringify(reports));
    } catch {
      saveStatus.textContent = "The report could not be saved in this browser.";
      return;
    }

    // Clear the form only after the report saves
    draftPin.remove();
    draftPin = undefined;
    form.reset();
    saveStatus.textContent = "";
    reportStatus.textContent = "Report saved.";
    showReport(report).openPopup();
  });
}

initializeMap();
