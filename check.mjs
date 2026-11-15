// Verifies this machine matches plugins.txt, refs.txt and claude/. Exit 1 on any mismatch.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kit = dirname(fileURLToPath(import.meta.url));
const dest = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');

export const rows = (file) =>
  readFileSync(join(kit, file), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/));

// Returns the list of problems; empty means the machine matches.
export function problems(wanted, installed) {
  const out = [];
  for (const [, id, state] of wanted) {
    if (id === '-') continue;
    // A plugin can be listed once per scope; the user-scope entry is the one the kit manages.
    const found = installed.find((p) => p.id === id && p.scope === 'user');
    if (!found) out.push(`${id}: not installed`);
    else if (found.enabled !== (state === 'on')) out.push(`${id}: should be ${state}`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wanted = rows('plugins.txt');
  const installed = JSON.parse(execSync('claude plugin list --json', { encoding: 'utf8' }));
  const bad = problems(wanted, installed);
  for (const [repo] of rows('refs.txt')) {
    if (!existsSync(join(dest, 'vendor', repo.split('/')[1], '.git'))) bad.push(`${repo}: reference repo missing`);
  }
  for (const name of readdirSync(join(kit, 'claude', 'agents'))) {
    if (!existsSync(join(dest, 'agents', name))) bad.push(`agents/${name}: not linked into ${dest}`);
  }
  if (readFileSync(join(dest, 'CLAUDE.md'), 'utf8') !== readFileSync(join(kit, 'claude', 'CLAUDE.md'), 'utf8')) {
    bad.push('CLAUDE.md: differs from the repo copy');
  }
  if (bad.length) {
    console.error('FAIL\n' + bad.map((b) => '  ' + b).join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${wanted.filter((r) => r[1] !== '-').length} plugins, ${rows('refs.txt').length} reference repos, handbook in place.`);
}
