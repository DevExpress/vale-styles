# Changelog

This file lists the changes in each release of `@devexpress/vale-styles`. Versions follow semantic versioning, so the version number shows whether an upgrade can produce new alerts in text that has not changed:

- **Major**: the upgrade can produce new alerts. Examples: a new rule or swap entry, a stricter regular expression, a higher alert level, a term removed from the vocabulary, a lower `MinAlertLevel`, or a newer minimum Vale version.
- **Minor**: the upgrade does not produce new alerts but adds something. Examples: new vocabulary terms, new output templates, or support for more Vale versions.
- **Patch**: the upgrade only fixes false positives or changes alert messages.

Add entries under `Unreleased` as you make changes. When you release, rename `Unreleased` to the new version and date, and start a new empty `Unreleased` section. The release workflow uses the section for the version as the GitHub release notes, and it fails if that section is missing. A prerelease uses the `Unreleased` section if the section for its version is missing.

## Unreleased

## 1.0.0 - 2026-10-23

- First npm release. The package contains the DX style, the trimmed Microsoft style, the DX vocabulary, the shared Vale configuration, and the JUnit and rdjsonl output templates.
- Requires Vale 3.25. The optional peer dependency `@vvago/vale ~3.25.1` checks the version when you install Vale from npm.
