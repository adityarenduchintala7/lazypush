const extensionFor = {
  "C++": "cpp",
  "Python": "py",
  "Java": "java",
  "JavaScript": "js",
  "TypeScript": "ts",
  "Go": "go",
  "C": "c",
  "C#": "cs"
};

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function problemDirectory(problem) {
  const prefix = Number.isInteger(problem.number) ? `${problem.number}-` : "";
  return `leetcode/${prefix}${problem.slug}`;
}

async function nextSolutionPath(repo, token, problem, extension) {
  const directory = problemDirectory(problem);
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${directory}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (response.status === 404) return `${directory}/solution-01.${extension}`;
  if (!response.ok) throw new Error(`GitHub couldn't list the problem folder (${response.status}).`);

  const files = await response.json();
  const highest = files.reduce((max, file) => {
    const match = file.name.match(new RegExp(`^solution-(\\d+)\\.${extension}$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${directory}/solution-${String(highest + 1).padStart(2, "0")}.${extension}`;
}

async function pushSolution({solution, repo, token}) {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error("Repository must be in owner/repository format.");
  if (!solution?.code?.trim() || !solution?.problem?.slug) throw new Error("No captured solution is available.");

  const hash = await sha256(solution.code);
  const storageKey = `pushed:${repo}:${solution.problem.slug}:${hash}`;
  const existing = await chrome.storage.local.get(storageKey);
  if (existing[storageKey]) return {ok: true, duplicate: true, path: existing[storageKey]};

  const extension = extensionFor[solution.problem.language] || "txt";
  const path = await nextSolutionPath(repo, token, solution.problem, extension);
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      message: `Add ${solution.problem.number ? `#${solution.problem.number} ` : ""}${solution.problem.slug} solution`,
      content: toBase64(solution.code)
    })
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message || `GitHub rejected the push (${response.status}).`);
  }

  await chrome.storage.local.set({[storageKey]: path});
  return {ok: true, duplicate: false, path};
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "ACCEPTED") {
    const result = {
      code: message.code,
      problem: message.problem,
      receivedAt: new Date().toISOString()
    };

    chrome.storage.local.set({lastAccepted: result});
    console.log("LazyPush captured accepted solution:", result);
    return;
  }

  if (message?.type === "PUSH_SOLUTION") {
    pushSolution(message)
      .then(sendResponse)
      .catch(error => sendResponse({ok: false, error: error.message}));
    return true;
  }
});
