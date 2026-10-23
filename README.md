# DevExpress Vale Styles

This repository contains a [Vale-compatible](https://github.com/vale-cli/vale) implementation of DevExpress Writing Style Guide.

Refer to Vale documentation for getting started instructions: [Installation](https://docs.vale.sh/topics/installation).

This repository includes Vale rules from [vale-cli/Microsoft](https://github.com/vale-cli/Microsoft) (MIT-licensed), which are based on the [Microsoft Writing Style Guide](https://github.com/MicrosoftDocs/microsoft-style-guide) (licensed under CC-BY-4.0). Refer to the following file for additional information: [THIRD_PARTY_NOTICES.md](/THIRD_PARTY_NOTICES.md).

## Use the Styles as an npm Package

The `@devexpress/vale-styles` package is published to GitHub Packages. Each package version contains the DX and Microsoft styles, the DX vocabulary, the shared Vale configuration, and output templates for CI. A package version is tied to a Vale version, so a documentation repository can pin both and upgrade them on its own schedule.

### Install the Package

1. Add an `.npmrc` file to the root of your documentation repository:

   ```ini
   @devexpress:registry=https://npm.pkg.github.com
   ```

   Do not add a token to this file. GitHub Actions workflows authenticate with their own `GITHUB_TOKEN` (see [Run Vale in GitHub Actions](#run-vale-in-github-actions)).
2. GitHub Packages requires a token for every installation. To install the package on your machine, create a personal access token (classic) with the `read:packages` scope and add it to your user-level npm configuration once:

   ```sh
   npm config set //npm.pkg.github.com/:_authToken=<your-token>
   ```

3. Install the package and Vale. Pin exact versions so that rule updates arrive only when you upgrade on purpose:

   ```sh
   npm install --save-dev --save-exact @devexpress/vale-styles@1.0.0 @vvago/vale@3.25.1
   ```

   The `@vvago/vale` package downloads the Vale binary in a `postinstall` script. If npm reports that the script is not approved, run `npm install-scripts approve @vvago/vale`. Do not install with `--ignore-scripts`.

The package declares the Vale version it supports in `peerDependencies`. npm fails the installation if your Vale version does not match. This check works only when you run Vale from npm (`npx vale`). A Vale binary from another source (for example, a Docker image) skips it.

### Configure Vale

Add a `.vale.ini` file to the root of your repository:

```ini
StylesPath = .vale/styles
Packages = node_modules/@devexpress/vale-styles/dist/DevExpress
```

The package supplies the rest of the configuration: the `DX` and `Microsoft` styles for Markdown and text files, the `DX` vocabulary, and the `suggestion` alert level. Settings in your `.vale.ini` file take priority over package settings.

The `vale sync` command copies the styles to the `StylesPath` folder. Do not commit the copied files. Add the following lines to `.gitignore`:

```gitignore
.vale/styles/*
```

#### Add Your Own Terms

To accept product names and terms that the DX vocabulary does not include, create a vocabulary of your own. For example, add terms to `.vale/styles/config/vocabularies/vNext/accept.txt`, one case-sensitive regular expression per line, and list the vocabulary in `.vale.ini`:

```ini
Vocab = vNext
```

Vale combines this vocabulary with the `DX` vocabulary from the package. To commit your vocabulary but not the copied styles, use the following `.gitignore` lines instead:

```gitignore
.vale/styles/*
!.vale/styles/config/
.vale/styles/config/*
!.vale/styles/config/vocabularies/
.vale/styles/config/vocabularies/*
!.vale/styles/config/vocabularies/vNext/
```

### Run Vale

Copy the styles to `StylesPath` after you install or update the package, and then lint your documentation:

```sh
npx vale sync
npx vale docs/
```

To produce JUnit XML or reviewdog output for CI tools, add `--output=node_modules/@devexpress/vale-styles/dist/templates/junit.tmpl` or `--output=node_modules/@devexpress/vale-styles/dist/templates/rdjsonl.tmpl`.

#### Run Vale in GitHub Actions

The following workflow checks every file in the `docs` folder. It installs the package with the workflow's own `GITHUB_TOKEN`, so the repository does not need a stored secret:

```yaml
name: Docs style

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  packages: read

jobs:
  vale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          registry-url: https://npm.pkg.github.com
          scope: '@devexpress'
      - run: npm ci
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: npx vale sync
      - run: npx vale docs/
```

If `npm ci` fails with a 403 error, an owner of the `@devexpress/vale-styles` package must add your repository under **Manage Actions access** in the package settings. CI systems outside GitHub do not have a `GITHUB_TOKEN`. In such systems, store a personal access token with the `read:packages` scope as a secret and add it to the npm configuration before `npm ci` with the `npm config set` command shown in [Install the Package](#install-the-package).

### Upgrade the Styles

1. Read the [CHANGELOG.md](CHANGELOG.md) entries between your version and the new one.
2. Update the `@devexpress/vale-styles` version in `package.json`. If the new version requires a different Vale version, update `@vvago/vale` as well.
3. Run `npm install`, `npx vale sync`, and Vale on all your documentation.
4. Fix new alerts in the same pull request, so that the check stays green.

## Version Policy

Package versions follow semantic versioning. A version number shows whether an upgrade can produce new alerts in text that has not changed:

- **Major**: the upgrade can produce new alerts. Examples: a new rule or swap entry, a stricter regular expression, a higher alert level, a term removed from the vocabulary, a lower `MinAlertLevel`, or a newer minimum Vale version.
- **Minor**: the upgrade does not produce new alerts but adds something. Examples: new vocabulary terms, new output templates, or support for more Vale versions.
- **Patch**: the upgrade only fixes false positives or changes alert messages.

## Develop the Styles

Rules are in the `vale/` folder, which you can also copy to a repository instead of installing the package. Install the development tools and run the tests from the repository root:

```sh
npm ci
npm test
```

The `npm test` command builds the package in the `dist/` folder, installs it in a temporary repository with `vale sync`, and checks the following:

- Vale loads every rule and the merged configuration without errors.
- The sample in `vale/vale/tests/clean.md` produces no alerts.
- Each rule that has a test file in `vale/vale/tests/DX/` produces at least one alert for that file.
- Files such as `CLAUDE.md` are skipped, and a vocabulary of your own works next to the `DX` vocabulary.
- The package contains exactly the expected files.

Add an entry to the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md) for each change. State whether the change can produce new alerts.

## Release a Version

1. In a new branch, run `npm version <major|minor|patch> --no-git-tag-version`. Use the [version policy](#version-policy) to choose the level.
2. In `CHANGELOG.md`, rename the `Unreleased` section to the new version and date (for example, `## 1.1.0 - 2026-11-02`), and add an empty `Unreleased` section above it.
3. Merge the pull request.
4. Tag the merge commit and push the tag:

   ```sh
   git tag v1.1.0
   git push origin v1.1.0
   ```

The `Release` workflow checks that the tag matches the `package.json` version and that `CHANGELOG.md` has a section for it. The workflow then runs the tests, publishes the package to GitHub Packages, and creates a GitHub release with the changelog section as release notes.

GitHub Packages makes a new package private, even if the repository is public. After the first release, an organization owner must change the visibility of `@devexpress/vale-styles` to internal in the package settings, so that workflows in other DevExpress repositories can install it.

To support a different Vale version, update `@vvago/vale` in `devDependencies` and the `peerDependencies` range in `package.json`, and run `npm install` and `npm test`. A newer minimum Vale version requires a major release.
