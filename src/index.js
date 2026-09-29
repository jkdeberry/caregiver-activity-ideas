const form = document.querySelector("#activity-form");
const topicInput = document.querySelector("#topic");
const submitButton = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");
const actionsEl = document.querySelector("#result-actions");
const anotherButton = document.querySelector("#another-button");
const copyButton = document.querySelector("#copy-button");
const printButton = document.querySelector("#print-button");

const ENDPOINT = "/.netlify/functions/generate";
const TIMEOUT_MS = 30000;
const FRIENDLY_ERROR =
  "Sorry, we couldn't create an idea just now. Please check your connection and try again.";

let currentActivity = null;
let previousTitles = [];

function getInputs() {
  const data = new FormData(form);
  return {
    topic: String(data.get("topic") || "").trim(),
    ability: data.get("ability") || "",
    setting: data.get("setting") || "",
    time: data.get("time") || "",
    about: String(data.get("about") || "").trim(),
  };
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setBusy(busy) {
  submitButton.disabled = busy;
  anotherButton.disabled = busy;
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function listSection(heading, items, ordered = false, className = "") {
  const section = el("section", "", className);
  section.append(el("h3", heading));
  const list = el(ordered ? "ol" : "ul");
  items.forEach((item) => list.append(el("li", item)));
  section.append(list);
  return section;
}

function textSection(heading, text) {
  const section = el("section");
  section.append(el("h3", heading));
  section.append(el("p", text));
  return section;
}

function renderActivity(activity) {
  resultEl.replaceChildren();
  const title = el("h2", activity.title);
  title.id = "result-title";
  resultEl.append(title, el("p", activity.intro));
  if (activity.supplies.length) resultEl.append(listSection("What you'll need", activity.supplies));
  resultEl.append(listSection("Steps", activity.steps, true));
  if (activity.safety.length) resultEl.append(listSection("Safety", activity.safety, false, "safety"));
  if (activity.ifFrustrated) resultEl.append(textSection("If they get frustrated", activity.ifFrustrated));
  if (activity.adapt) resultEl.append(textSection("Make it easier or harder", activity.adapt));
  const printNote = el(
    "p",
    "AI-generated suggestion. Adapt to the person and check with their care team.",
    "print-only"
  );
  resultEl.append(printNote);
  resultEl.hidden = false;
  actionsEl.hidden = false;
}

async function requestActivity(includePrevious) {
  const inputs = getInputs();
  if (!inputs.topic) {
    setStatus("Please enter a topic first, or tap one of the suggestions.", true);
    topicInput.focus();
    return;
  }
  if (!includePrevious) previousTitles = [];

  setBusy(true);
  setStatus(`Creating an idea about ${inputs.topic}…`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inputs, avoid: previousTitles.slice(-5) }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.activity) {
      throw new Error(payload.error || FRIENDLY_ERROR);
    }
    currentActivity = payload.activity;
    previousTitles.push(currentActivity.title);
    renderActivity(currentActivity);
    setStatus("Here's an idea.");
    resultEl.focus();
  } catch (err) {
    const message = err.name === "AbortError" ? FRIENDLY_ERROR : err.message || FRIENDLY_ERROR;
    setStatus(message, true);
  } finally {
    clearTimeout(timer);
    setBusy(false);
  }
}

function activityToText(activity) {
  const lines = [activity.title, "", activity.intro, ""];
  if (activity.supplies.length) {
    lines.push("What you'll need:", ...activity.supplies.map((s) => `- ${s}`), "");
  }
  lines.push("Steps:", ...activity.steps.map((s, i) => `${i + 1}. ${s}`), "");
  if (activity.safety.length) {
    lines.push("Safety:", ...activity.safety.map((s) => `- ${s}`), "");
  }
  if (activity.ifFrustrated) lines.push("If they get frustrated:", activity.ifFrustrated, "");
  if (activity.adapt) lines.push("Make it easier or harder:", activity.adapt, "");
  lines.push("AI-generated suggestion. Adapt to the person and check with their care team.");
  return lines.join("\n");
}

async function copyActivity() {
  if (!currentActivity) return;
  try {
    await navigator.clipboard.writeText(activityToText(currentActivity));
    setStatus("Copied.");
  } catch {
    setStatus("Sorry, copying isn't available here. Try Print instead.", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  requestActivity(false);
});

anotherButton.addEventListener("click", () => requestActivity(true));
copyButton.addEventListener("click", copyActivity);
printButton.addEventListener("click", () => window.print());

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    topicInput.value = chip.dataset.topic;
    requestActivity(false);
  });
});
