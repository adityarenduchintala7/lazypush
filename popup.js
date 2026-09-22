async function getTab() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  return tabs[0];
}

async function capture() {
  const tab = await getTab();
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, {type: "GET_CURRENT"}, async (response) => {
    if (chrome.runtime.lastError) {
      document.querySelector("#status").textContent =
        "Open a LeetCode problem page first.";
      return;
    }

    if (!response?.code) {
      document.querySelector("#status").textContent =
        "Couldn't read the editor yet.";
      return;
    }

    await chrome.storage.local.set({manualCapture: response});

    document.querySelector("#problem").textContent =
      response.problem?.slug || "Unknown";
    document.querySelector("#language").textContent =
      response.problem?.language || "unknown";
    document.querySelector("#status").textContent =
      `Captured ${response.code.length} characters.`;
  });
}

function showCaptured(solution, prefix = "Captured") {
  document.querySelector("#problem").textContent =
    solution.problem?.slug || "Unknown";
  document.querySelector("#language").textContent =
    solution.problem?.language || "unknown";
  document.querySelector("#status").textContent =
    `${prefix} ${solution.code.length} characters.`;
}

async function push() {
  const settings = await chrome.storage.local.get(["repo", "token", "manualCapture", "lastAccepted"]);
  const solution = settings.manualCapture || settings.lastAccepted;

  if (!solution?.code || !solution?.problem?.slug) {
    document.querySelector("#status").textContent = "Capture a solution first.";
    return;
  }

  if (!settings.repo || !settings.token) {
    document.querySelector("#status").textContent = "Save your repository and GitHub token first.";
    return;
  }

  document.querySelector("#status").textContent = "Pushing to GitHub…";
  const result = await chrome.runtime.sendMessage({
    type: "PUSH_SOLUTION",
    solution,
    repo: settings.repo,
    token: settings.token
  });

  document.querySelector("#status").textContent = result?.ok
    ? result.duplicate
      ? `This exact solution is already at ${result.path}.`
      : `Pushed ${result.path}.`
    : result?.error || "Couldn't push the solution.";
}

async function load() {
  const data = await chrome.storage.local.get(["repo", "token", "lastAccepted", "manualCapture"]);
  document.querySelector("#repo").value = data.repo || "";
  document.querySelector("#token").value = data.token || "";

  const solution = data.manualCapture || data.lastAccepted;
  if (solution) {
    showCaptured(solution, data.manualCapture ? "Captured" : "Accepted captured");
  }
}

document.querySelector("#save").addEventListener("click", async () => {
  const repo = document.querySelector("#repo").value.trim();
  const token = document.querySelector("#token").value.trim();
  await chrome.storage.local.set({repo, token});
  document.querySelector("#status").textContent = "GitHub settings saved.";
});

document.querySelector("#capture").addEventListener("click", capture);
document.querySelector("#push").addEventListener("click", push);
load();
