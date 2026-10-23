// Release gate. Builds the package, installs it into a throwaway consumer the way the README
// documents (Packages + `vale sync`), and checks that the rules load and behave.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const valePkg = require.resolve('@vvago/vale/package.json');
const valeBin = join(dirname(valePkg), require(valePkg).bin.vale);

const failures = [];
const check = (ok, message) => ok || failures.push(message);

// Exit code 1 only means error-level alerts; 2 means Vale could not run (bad config, rule, or regex).
function vale(cwd, ...args) {
  const result = spawnSync(process.execPath, [valeBin, '--no-global', ...args], { cwd, encoding: 'utf8' });
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`vale ${args.join(' ')} exited with ${result.status}:\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

const alerts = (cwd, ...files) => JSON.parse(vale(cwd, '--output=JSON', ...files));

spawnSync(process.execPath, [join(root, 'scripts', 'build.mjs')], { stdio: 'inherit' });

const consumer = mkdtempSync(join(tmpdir(), 'vale-styles-smoke-'));
try {
  cpSync(join(root, 'dist'), join(consumer, 'node_modules', '@devexpress', 'vale-styles', 'dist'), { recursive: true });
  writeFileSync(join(consumer, '.vale.ini'), [
    'StylesPath = styles',
    'Packages = node_modules/@devexpress/vale-styles/dist/DevExpress',
    'Vocab = Smoke',
    '',
  ].join('\n'));
  mkdirSync(join(consumer, 'styles', 'config', 'vocabularies', 'Smoke'), { recursive: true });
  // Use a term that no fixture contains, or the vocabulary would hide fixture alerts too.
  writeFileSync(join(consumer, 'styles', 'config', 'vocabularies', 'Smoke', 'accept.txt'), 'recurrent\n');

  vale(consumer, 'sync');

  const config = JSON.parse(vale(consumer, 'ls-config'));
  const markdownStyles = config.SBaseStyles?.['*.{md,MD,TXT,txt}'] ?? [];
  check(markdownStyles.includes('DX') && markdownStyles.includes('Microsoft'),
    `Markdown files should use DX and Microsoft, got ${JSON.stringify(markdownStyles)}`);
  check(config.Vocab?.includes('DX') && config.Vocab?.includes('Smoke'),
    `Vocab should merge DX with the consumer's Smoke vocabulary, got ${JSON.stringify(config.Vocab)}`);

  const clean = alerts(consumer, join(root, 'vale', 'vale', 'tests', 'clean.md'));
  for (const alert of Object.values(clean).flat()) {
    check(false, `clean.md:${alert.Line} ${alert.Check}: ${alert.Message}`);
  }

  // Each fixture is named after its rule, so that rule must fire at least once.
  const fixtures = alerts(consumer, join(root, 'vale', 'vale', 'tests', 'DX'));
  for (const file of readdirSync(join(root, 'vale', 'vale', 'tests', 'DX'))) {
    const rule = `DX.${basename(file, '.md')}`;
    const fired = Object.entries(fixtures).some(([path, list]) => basename(path) === file && list.some(a => a.Check === rule));
    check(fired, `${rule} did not fire on its fixture ${file}`);
  }

  writeFileSync(join(consumer, 'CLAUDE.md'), "The Chart can't do this.\n");
  writeFileSync(join(consumer, 'vocab.md'), 'The Chart supports recurrent appointments.\n');
  const skipped = alerts(consumer, 'CLAUDE.md', 'vocab.md');
  check(Object.keys(skipped).length === 0,
    `CLAUDE.md should be skipped and the consumer vocabulary should accept "recurrent", got ${JSON.stringify(skipped)}`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}

// The published tarball must hold exactly the built package plus the license files.
const pack = spawnSync('npm pack --dry-run --json --ignore-scripts', { cwd: root, encoding: 'utf8', shell: true });
const packed = new Set(JSON.parse(pack.stdout)[0].files.map(f => f.path));
const stylesDir = join(root, 'vale', 'vale', 'styles');
const styles = readdirSync(stylesDir, { recursive: true })
  .filter(path => statSync(join(stylesDir, path)).isFile())
  .map(path => `dist/DevExpress/styles/${path.replaceAll('\\', '/')}`);
const expected = [
  'package.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md',
  'dist/DevExpress/.vale.ini', 'dist/templates/junit.tmpl', 'dist/templates/rdjsonl.tmpl',
  ...styles,
];
for (const path of expected) check(packed.has(path), `Tarball is missing ${path}`);
for (const path of packed) check(expected.includes(path), `Tarball has unexpected file ${path}`);

if (failures.length) {
  console.error(`Smoke test failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Smoke test passed: ${packed.size} files packed, ${vale(root, '--version').trim()}.`);
