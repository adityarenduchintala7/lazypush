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

async function load() {
  const data = await chrome.storage.local.get(["repo", "lastAccepted"]);
  document.querySelector("#repo").value = data.repo || "";

  if (data.lastAccepted) {
    document.querySelector("#problem").textContent =
      data.lastAccepted.problem?.slug || "Unknown";
    document.querySelector("#language").textContent =
      data.lastAccepted.problem?.language || "unknown";
    document.querySelector("#status").textContent =
      `Accepted captured at ${data.lastAccepted.receivedAt}`;
  }
}

document.querySelector("#save").addEventListener("click", async () => {
  const repo = document.querySelector("#repo").value.trim();
  await chrome.storage.local.set({repo});
  document.querySelector("#status").textContent = "Repository saved.";
});

document.querySelector("#capture").addEventListener("click", capture);
load();