const storageKey = "campus-safety-reports";
const form = document.querySelector("#report-form");
const locationStatus = document.querySelector("#location");
const reportStatus = document.querySelector("#report-status");
const descriptionInput = document.querySelector("#description");
const timeInput = document.querySelector("#occurred-at");

function loadReports() {
  const reports = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (!Array.isArray(reports)) {
    throw new Error("Invalid report storage");
  }
  return reports;
}

function initializeMap() {
  if (!window.L) {
    for (const control of form.elements) control.disabled = true;
    reportStatus.textContent = "The map could not load. Check your connection and reload.";
    return;
  }

  const map = L.map("map", { doubleClickZoom: false }).setView([44.5650, -123.2789], 16);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  let draftPin;

  function showLocation() {
    const { lat, lng } = draftPin.getLatLng().wrap();
    locationStatus.textContent = `Selected location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  function placePin(latLng) {
    if (draftPin) {
      draftPin.setLatLng(latLng);
    } else {
      draftPin = L.marker(latLng, {
        draggable: true,
        autoPan: true,
        zIndexOffset: 1000,
        alt: "Incident location",
      }).addTo(map).on("dragend", showLocation);
    }
    showLocation();
  }

  function showReport(report) {
    const popup = document.createElement("div");
    const time = document.createElement("strong");
    time.textContent = new Date(report.occurredAt).toLocaleString();
    const description = document.createElement("p");
    description.className = "report-description";
    description.textContent = report.description;
    popup.append(time, description);

    return L.circleMarker([report.lat, report.lng], {
      radius: 8,
      color: "#fff",
      weight: 2,
      fillColor: "#a33513",
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

  map.on("click", (event) => placePin(event.latlng));
  document.querySelector("#center-pin").addEventListener("click", () => placePin(map.getCenter()));

  descriptionInput.addEventListener("input", () => descriptionInput.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = descriptionInput.value.trim();

    if (!description) {
      descriptionInput.setCustomValidity("Enter a description.");
      descriptionInput.reportValidity();
      return;
    }
    if (!draftPin) {
      reportStatus.textContent = "Choose an incident location on the map.";
      return;
    }

    const { lat, lng } = draftPin.getLatLng().wrap();
    const report = { lat, lng, description, occurredAt: timeInput.value };
    try {
      const reports = loadReports();
      reports.push(report);
      localStorage.setItem(storageKey, JSON.stringify(reports));
    } catch {
      reportStatus.textContent = "The report could not be saved in this browser.";
      return;
    }

    draftPin.remove();
    draftPin = undefined;
    form.reset();
    locationStatus.textContent = "No location selected";
    reportStatus.textContent = "Report saved.";
    showReport(report).openPopup();
  });
}

initializeMap();
