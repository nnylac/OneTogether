const state = {
  catalogue: null,
};

const typeSelect = document.querySelector("#incident-type");
const locationSelect = document.querySelector("#location");
const descriptionSelect = document.querySelector("#description");
const severitySelect = document.querySelector("#severity");
const agenciesContainer = document.querySelector("#agencies");
const form = document.querySelector("#incident-form");
const result = document.querySelector("#result");
const generateButton = document.querySelector("#generate-button");
const pauseButton = document.querySelector("#pause-button");
const resumeButton = document.querySelector("#resume-button");

function selectedType() {
  return state.catalogue.incident_catalogue.find(
    (entry) => entry.type === typeSelect.value,
  );
}

function option(value, label = value) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTypeDetails() {
  const entry = selectedType();
  descriptionSelect.replaceChildren(
    ...entry.descriptions.map((description) => option(description)),
  );

  severitySelect.replaceChildren();
  for (let severity = entry.severity_min; severity <= entry.severity_max; severity += 1) {
    severitySelect.append(option(String(severity), `Severity ${severity}`));
  }

  const relevantAgencies = new Set([
    ...entry.required_agencies,
    ...entry.optional_agencies,
  ]);
  agenciesContainer.replaceChildren(
    ...state.catalogue.agencies.map((agency) => {
      const label = document.createElement("label");
      label.className = "agency-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "agency";
      checkbox.value = agency;
      checkbox.checked = entry.required_agencies.includes(agency);

      const name = document.createElement("span");
      name.textContent = agency.replaceAll("_", " ");

      label.append(checkbox, name);
      if (entry.required_agencies.includes(agency)) {
        const required = document.createElement("small");
        required.textContent = "default";
        label.append(required);
      } else if (!relevantAgencies.has(agency)) {
        label.title = "This agency is not normally assigned to the selected incident type.";
      }
      return label;
    }),
  );
}

async function refreshAutomation() {
  const response = await fetch("/automation");
  if (!response.ok) {
    throw new Error("Unable to load automation status");
  }

  const automation = await response.json();
  const dot = document.querySelector("#automation-dot");
  const status = document.querySelector("#automation-status");
  const detail = document.querySelector("#automation-detail");

  dot.className = `status-dot ${automation.enabled ? "enabled" : "paused"}`;
  status.textContent = automation.enabled ? "Running" : "Paused";
  detail.textContent = `${automation.active_incidents} active incident(s). Random interval: ${automation.interval_seconds}s.`;
  pauseButton.disabled = !automation.enabled;
  resumeButton.disabled = automation.enabled;
}

async function setAutomation(action) {
  pauseButton.disabled = true;
  resumeButton.disabled = true;
  try {
    const response = await fetch(`/automation/${action}`, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Unable to ${action} automatic generation`);
    }
    await refreshAutomation();
  } catch (error) {
    result.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    await refreshAutomation().catch(() => {});
  }
}

async function loadCatalogue() {
  const response = await fetch("/catalogue");
  if (!response.ok) {
    throw new Error("Unable to load scenario catalogue");
  }

  state.catalogue = await response.json();
  typeSelect.replaceChildren(
    ...state.catalogue.incident_catalogue.map((entry) =>
      option(entry.type, entry.type.replaceAll("_", " ")),
    ),
  );
  locationSelect.replaceChildren(
    ...state.catalogue.locations.map((location) =>
      option(location.name, `${location.name} (${location.area})`),
    ),
  );
  renderTypeDetails();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const agencies = [
    ...document.querySelectorAll('input[name="agency"]:checked'),
  ].map((checkbox) => checkbox.value);

  if (agencies.length === 0) {
    result.innerHTML = '<p class="error">Select at least one receiving agency.</p>';
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "Sending...";
  result.textContent = "Generating incident and contacting agencies...";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_type: typeSelect.value,
        location_name: locationSelect.value,
        description: descriptionSelect.value,
        severity: Number(severitySelect.value),
        agencies,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.detail || "Incident generation failed");
    }

    const deliveries = body.deliveries
      .map((delivery) => {
        const outcome = delivery.accepted
          ? `accepted (${delivery.status_code})`
          : `failed${delivery.error ? `: ${delivery.error}` : ""}`;
        return `<li><strong>${escapeHtml(delivery.agency)}</strong>: ${escapeHtml(outcome)}</li>`;
      })
      .join("");

    result.innerHTML = `
      <p class="result-title">${escapeHtml(body.incident.incident_type)} at ${escapeHtml(body.incident.location.name)}</p>
      <div>Incident ID: <code>${escapeHtml(body.incident.incident_id)}</code></div>
      <div>${escapeHtml(body.incident.description)}</div>
      <ul class="delivery-list">${deliveries}</ul>
    `;
    await refreshAutomation();
  } catch (error) {
    result.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate incident";
  }
});

typeSelect.addEventListener("change", renderTypeDetails);
pauseButton.addEventListener("click", () => setAutomation("pause"));
resumeButton.addEventListener("click", () => setAutomation("resume"));

Promise.all([loadCatalogue(), refreshAutomation()]).catch((error) => {
  result.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
});

window.setInterval(() => {
  refreshAutomation().catch(() => {});
}, 5000);
