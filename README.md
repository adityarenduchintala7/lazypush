# LeetSync

A Chrome Manifest V3 extension for preserving distinct LeetCode solutions and eventually syncing them to GitHub.

## Current MVP

- Detects LeetCode problem pages.
- Reads the Monaco editor content.
- Captures the current language/problem slug.
- Watches for an `Accepted` result.
- Stores the last accepted solution in `chrome.storage`.
- Lets you manually capture the current solution.
- Stores a target GitHub repository name.

## Planned

1. Robustly detect accepted submissions.
2. Hash submitted code with SHA-256.
3. Ignore exact duplicate submissions.
4. Number distinct approaches automatically.
5. Authenticate with GitHub securely.
6. Create problem folders and solution files through the GitHub API.
7. Generate/update README files with runtime, memory, language and approach history.
8. Add a sync history/dashboard.

## Load locally

Chrome/Brave:
1. Open `chrome://extensions` or `brave://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder.
5. Open a LeetCode problem.

This is intentionally an MVP. LeetCode's frontend can change, so DOM-based detection will need to be hardened before treating it as production-ready.
