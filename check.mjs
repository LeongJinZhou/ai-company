// Verifies this machine matches plugins.txt, refs.txt, claude/ and the tools the installers add. Exit 1 on any mismatch.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { additions, missing, readSettings } from './settings-merge.mjs';

const kit = dirname(fileURLToPath(import.meta.url));
const dest = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');

// The programs the handbook's checks call. Both installers install every one.
export const tools = ['gh', 'gitleaks', 'semgrep', 'osv-scanner', 'bun', 'ccusage'];

// True when a command runs on this machine. It runs from the kit folder, never from the
// folder the user stands in (on Windows that folder is searched for programs first), and
// a command that hangs counts as not running.
export const runs = (command) => {
  try {
    execSync(command, { cwd: kit, stdio: 'ignore', timeout: 60000 });
    return true;
  } catch {
    return false;
  }
};

// One problem line for each key of the kit's settings that this machine's settings lack.
export function settingsProblems(current, wanted) {
  if (current === null) return ['settings.json: cannot be read as a JSON object; repair the file, then run bash update.sh'];
  return missing(current, wanted).map((key) => `settings.json: ${key} is missing; run bash update.sh`);
}

// One problem line for each file of the kit's linked folders that this machine's config folder lacks.
export function linkProblems(kitFolder, configFolder) {
  const out = [];
  for (const folder of ['agents', 'rules', 'templates']) {
    for (const name of readdirSync(join(kitFolder, folder))) {
      if (!existsSync(join(configFolder, folder, name))) out.push(`${folder}/${name}: not linked into ${configFolder}`);
    }
  }
  return out;
}

// One problem line for each tool that does not run.
export const toolProblems = (names, works) =>
  names.filter((name) => !works(`${name} --version`)).map((name) => `${name}: not installed; run the installer again`);

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
  for (const [repo, name] of rows('skills.txt')) {
    if (!existsSync(join(dest, 'skills', name, 'SKILL.md'))) bad.push(`${repo}: skill ${name} missing`);
  }
  if (!existsSync(join(dest, 'skills', 'lessons', 'SKILL.md'))) {
    bad.push('lessons: your own lessons file is missing; run bash update.sh');
  }
  bad.push(...linkProblems(join(kit, 'claude'), dest));
  const handbook = join(dest, 'CLAUDE.md');
  if (!existsSync(handbook)) bad.push('CLAUDE.md: missing; run bash update.sh');
  else if (readFileSync(handbook, 'utf8') !== readFileSync(join(kit, 'claude', 'CLAUDE.md'), 'utf8')) {
    bad.push('CLAUDE.md: differs from the repo copy');
  }
  bad.push(...settingsProblems(readSettings(join(dest, 'settings.json')), additions()));
  if (!runs('claude mcp get playwright')) {
    bad.push('playwright: browser connection missing; run: claude mcp add --scope user playwright npx @playwright/mcp@latest');
  }
  bad.push(...toolProblems(tools, runs));
  if (bad.length) {
    console.error('FAIL\n' + bad.map((b) => '  ' + b).join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${wanted.filter((r) => r[1] !== '-').length} plugins, ${rows('refs.txt').length} reference repos, ${rows('skills.txt').length} GitHub skills, handbook, settings and tools in place.`);
}
