(() => {
  const state = {
    lastCode: "",
    lastProblem: null
  };

  function getProblemSlug() {
    const match = location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getProblemNumber() {
    const title = [...document.querySelectorAll("h1, h2")]
      .find(element => isVisible(element) && /^\d+\.\s+/.test(element.innerText?.trim() || ""));
    const text = title?.innerText || document.body.innerText;
    const match = text.match(/(?:^|\n)(\d+)\.\s+[^\n]+/);
    return match ? Number(match[1]) : null;
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

  function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      rect.width > 0 && rect.height > 0;
  }

  function getLanguage() {
    const candidates = ["C++", "Python", "Java", "JavaScript", "TypeScript", "Go", "C", "C#"];
    const editor = document.querySelector(".monaco-editor");
    const editorRect = editor?.getBoundingClientRect();
    const matches = [...document.querySelectorAll("*")]
      .filter(isVisible)
      .map(element => ({element, language: element.innerText?.trim() || ""}))
      .filter(({language}) => candidates.includes(language));

    if (!matches.length) return "unknown";
    if (!editorRect) return matches[0].language;

    matches.sort(({element: a}, {element: b}) => {
      const distance = element => {
        const rect = element.getBoundingClientRect();
        return Math.abs(rect.bottom - editorRect.top) + Math.abs(rect.left - editorRect.left);
      };
      return distance(a) - distance(b);
    });

    return matches[0].language;
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
      number: getProblemNumber(),
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
