---
name: commit
description: Commit changes with automatic semver versioning and Czech changelog
user_invocable: true
---

# Commit with versioning and changelog

Follow these steps precisely:

## 1. Analyze changes

Run `git status` and `git diff` (staged + unstaged) to understand all changes. Also run `git log --oneline -5` for commit style reference.

## 2. Determine semver bump

Read the current version from `package.json` field `"version"`.

Decide the bump level based on what changed:
- **patch** (0.0.X): bug fixes, typo fixes, small CSS tweaks, config changes, dependency updates
- **minor** (0.X.0): new features, new API endpoints, new admin sections, significant UI changes, new pages, database schema changes
- **major** (X.0.0): breaking API changes, complete rewrites, fundamental architecture changes (rarely used — ask user to confirm before using major)

When bumping minor, reset patch to 0. When bumping major, reset minor and patch to 0.

## 3. Update version in package.json

Edit the `"version"` field in `package.json` to the new version.

## 4. Update CHANGELOG.md

Read the existing `CHANGELOG.md`. Prepend a new entry at the top (after the `# Changelog` heading) in this format:

```
## X.Y.Z (YYYY-MM-DD)
- Stručný popis změny 1
- Stručný popis změny 2
```

Rules for changelog entries:
- Write in **Czech**
- Keep it concise — summarize what changed from a user/admin perspective, not implementation details
- Group related changes into single bullets
- Use plain language, no technical jargon unless necessary
- Do NOT list every file changed — describe the functional change
- 1-5 bullet points typically

## 5. Update public/version.json

Write `public/version.json` as a single-line JSON object with two fields:
- `version` — the new semver version string
- `changelog` — the FULL content of CHANGELOG.md (everything after the `# Changelog` heading), with newlines as `\n`

Example: `{"version":"1.8.0","changelog":"## 1.8.0 (2026-03-13)\n- Nová funkce\n\n## 1.7.0 (2026-03-12)\n- Starší změna"}`

This file is served as a static asset and read by the admin panel to show the version badge and changelog modal.

## 6. Stage and commit

Stage all changed files (including the files you modified: package.json, CHANGELOG.md, public/version.json, plus whatever the user changed). Create a commit with a message in this format:

```
vX.Y.Z – Brief English summary of changes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

The commit message summary should be short (under 70 chars after the version prefix).

## 7. Ask about push

After committing, ask the user if they want to push to master.
