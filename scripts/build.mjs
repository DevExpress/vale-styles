// Assembles the npm package contents in dist/ from the vale/ folder, which stays the source of truth.
//
// dist/DevExpress/ is a Vale package directory (https://docs.vale.sh/keys/packages):
// a .vale.ini next to a styles/ folder. Consumers list it in Packages and run `vale sync`.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pkg = join(dist, 'DevExpress');

rmSync(dist, { recursive: true, force: true });

cpSync(join(root, 'vale', 'vale', 'styles'), join(pkg, 'styles'), { recursive: true });

// StylesPath belongs to the consumer's config, so drop it from the shipped one.
const config = readFileSync(join(root, 'vale', '.vale.ini'), 'utf8')
  .replace(/^StylesPath\s*=.*(\r?\n)+/m, '');
writeFileSync(join(pkg, '.vale.ini'), config);

mkdirSync(join(dist, 'templates'));
for (const template of ['junit.tmpl', 'rdjsonl.tmpl']) {
  cpSync(join(root, 'vale', template), join(dist, 'templates', template));
}

console.log(`Built ${dist}`);
