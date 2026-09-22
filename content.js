(() => {
  const state = {
    lastCode: "",
    lastProblem: null
  };

  function getProblemSlug() {
    const match = location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getEditorText() {
    // Monaco editor
    const monaco = document.querySelector(".monaco-editor");
    if (monaco) {
      const lines = [...monaco.querySelectorAll(".view-lines .view-line")]
        .map(el => el.textContent ?? "");
      if (lines.length) return lines.join("\n");
    }

    // Fallback: textarea/contenteditable editors
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || active.isContentEditable)) {
      return active.value ?? active.innerText ?? "";
    }

    return "";
  }

  function getLanguage() {
    const text = document.body.innerText;
    const candidates = ["C++", "Python", "Java", "JavaScript", "TypeScript", "Go", "C", "C#"];
    return candidates.find(x => text.includes(x)) || "unknown";
  }

  function detectAccepted() {
    const body = document.body.innerText;
    return /\bAccepted\b/i.test(body);
  }

  function snapshot() {
    const slug = getProblemSlug();
    const code = getEditorText();
    if (!slug || !code.trim()) return;

    state.lastCode = code;
    state.lastProblem = {
      slug,
      language: getLanguage(),
      url: location.href,
      capturedAt: new Date().toISOString()
    };
  }

  // Keep a recent copy of the editor content.
  setInterval(snapshot, 1500);

  // When the page changes after Submit, look for Accepted.
  let lastAccepted = false;
  setInterval(() => {
    const accepted = detectAccepted();
    if (accepted && !lastAccepted && state.lastCode && state.lastProblem) {
      chrome.runtime.sendMessage({
        type: "ACCEPTED",
        code: state.lastCode,
        problem: state.lastProblem
      });
    }
    lastAccepted = accepted;
  }, 1000);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "GET_CURRENT") {
      snapshot();
      sendResponse({
        code: state.lastCode,
        problem: state.lastProblem
      });
    }
    return true;
  });
})();