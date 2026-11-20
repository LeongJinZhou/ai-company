// Verifies this machine matches plugins.txt, refs.txt, antigravity/ and the tools the installers add. Exit 1 on any mismatch.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { additions, missing, readSettings, settingsFile } from './settings-merge.mjs';

const kit = dirname(fileURLToPath(import.meta.url));
const dest = join(homedir(), '.gemini', 'config');

// The programs the handbook's checks call. Both installers install every one.
export const tools = ['gh', 'gitleaks', 'semgrep', 'osv-scanner', 'bun'];

// The folders the Antigravity installers put agy in; they do not always add it to PATH.
export const agyFolders = (home) => [join(home, '.gemini', 'bin'), join(home, '.local', 'bin'), join(home, 'AppData', 'Local', 'agy', 'bin')];

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

// What a command prints, or '' when it fails or hangs. Runs from the kit folder, like `runs`.
export const output = (command) => {
  try {
    return execSync(command, { cwd: kit, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 });
  } catch {
    return '';
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

// Problems with the lessons skill. kit.md is the kit's file, the same on every laptop;
// SKILL.md is the laptop's own file and must tell the reader to read kit.md too.
export function lessonsProblems(folder) {
  const own = join(folder, 'SKILL.md');
  if (!existsSync(own)) return ['lessons: your own lessons file is missing; run bash update.sh'];
  const out = [];
  if (!existsSync(join(folder, 'kit.md'))) out.push('lessons: kit.md, the lessons that come with the kit, is missing');
  let text = '';
  try {
    text = readFileSync(own, 'utf8');
  } catch {
    return [...out, 'lessons: your own lessons file cannot be read'];
  }
  // The same words update.sh looks for before it adds the pointer line.
  if (!text.includes('`kit.md` beside this file')) out.push('lessons: your own lessons file does not point to kit.md; run bash update.sh');
  return out;
}

// One problem line for each tool that does not run.
export const toolProblems = (names, works) =>
  names.filter((name) => !works(`${name} --version`)).map((name) => `${name}: not installed; run the installer again`);

// True when an installed plugin carries hooks that were written for Claude Code: such hooks
// can write into ~/.claude, the setup of the Claude Code kit that may live on the same laptop.
export function claudeHooks(pluginFolder) {
  return ['hooks.json', join('hooks', 'hooks.json')].some((file) => {
    try {
      return /CLAUDE_|\.claude\b/.test(readFileSync(join(pluginFolder, file), 'utf8'));
    } catch {
      return false;
    }
  });
}

// The model names `agy models` prints: one "<id><tab><label>" line per model.
export const modelLabels = (text) =>
  text
    .split(/\r?\n/)
    .filter((line) => line.includes('\t'))
    .map((line) => line.split('\t')[1].trim());

// How many commits this copy of the kit is behind its branch on GitHub. 0 when that cannot
// be known: no network, or a branch that follows nothing. `git` runs one git command in the kit folder.
export function commitsBehind(git) {
  try {
    git('fetch --quiet');
  } catch {
    // No network: what the last fetch learned still counts.
  }
  try {
    return Number(git('rev-list --count HEAD..@{u}')) || 0;
  } catch {
    return 0;
  }
}

export const rows = (file) =>
  readFileSync(join(kit, file), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/));

// Returns the list of problems; empty means the machine matches.
// `installed` is what `agy plugin list --json` prints: one { name, enabled } per plugin.
export function problems(wanted, installed) {
  const out = [];
  for (const [, name, state] of wanted) {
    if (name === '-') continue;
    const found = installed.find((p) => p.name === name);
    if (!found) out.push(`${name}: not installed`);
    else if (found.enabled !== (state === 'on')) out.push(`${name}: should be ${state}`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.env.PATH = [process.env.PATH, ...agyFolders(homedir())].join(delimiter);
  const wanted = rows('plugins.txt');
  const installed = JSON.parse(execSync('agy plugin list --json', { cwd: kit, encoding: 'utf8' }));
  const bad = problems(wanted, installed);
  for (const [repo] of rows('refs.txt')) {
    if (!existsSync(join(dest, 'vendor', repo.split('/')[1], '.git'))) bad.push(`${repo}: reference repo missing`);
  }
  for (const [repo, name] of rows('skills.txt')) {
    if (!existsSync(join(dest, 'skills', name, 'SKILL.md'))) bad.push(`${repo}: skill ${name} missing`);
  }
  bad.push(...lessonsProblems(join(dest, 'skills', 'lessons')));
  bad.push(...linkProblems(join(kit, 'antigravity'), dest));
  const handbook = join(dest, 'GEMINI.md');
  if (!existsSync(handbook)) bad.push('GEMINI.md: missing; run bash update.sh');
  else if (readFileSync(handbook, 'utf8') !== readFileSync(join(kit, 'antigravity', 'GEMINI.md'), 'utf8')) {
    bad.push('GEMINI.md: differs from the repo copy');
  }
  bad.push(...settingsProblems(readSettings(settingsFile()), additions()));
  if (!/^playwright\s/m.test(output('agy mcp list'))) {
    bad.push('playwright: browser connection missing; run: agy mcp add playwright npx @playwright/mcp@latest');
  }
  bad.push(...toolProblems(tools, runs));
  // The real thing, once: an agy that answers --version can still be unable to reach its models.
  const offered = modelLabels(output('agy models'));
  if (!offered.length) bad.push('agy: cannot list its models; start agy once and sign in');
  // A pull that failed leaves an old company in place; without this line the check would still say OK.
  const behind = commitsBehind((args) => execSync(`git ${args}`, { cwd: kit, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 }));
  if (behind) bad.push(`ai-company: this copy is ${behind} commits behind GitHub; run bash update.sh, and if its pull fails run git status in ${kit}`);
  if (bad.length) {
    console.error('FAIL\n' + bad.map((b) => '  ' + b).join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${wanted.filter((r) => r[1] !== '-').length} plugins, ${rows('refs.txt').length} reference repos, ${rows('skills.txt').length} GitHub skills, handbook, settings and tools in place.`);
  // The laptop matches the kit, but this account's plan may not offer the kit's lead model.
  const lead = additions().model;
  if (!offered.includes(lead)) {
    console.log(`WARN: this account is not offered the kit's lead model "${lead}". Pick the best model you have with /model.`);
  }
  // A plugin that is on runs its hooks in every session. The kit keeps none on that carries Claude Code hooks.
  for (const plugin of installed.filter((p) => p.enabled && p.path && claudeHooks(p.path))) {
    console.log(`WARN: the plugin ${plugin.name} is on and carries hooks written for Claude Code; they may write into ~/.claude. Turn it off when the task is done: agy plugin disable ${plugin.name}`);
  }
  // semgrep can be installed and still unable to scan (seen on Windows). The laptop still
  // matches the kit, so this is a warning: the lead then reports that semgrep did not run.
  if (!runs('semgrep scan -e "eval(...)" --lang js --metrics off --quiet check.mjs')) {
    console.log('WARN: semgrep is installed but cannot scan on this laptop. Security checks run without it; say so in every report.');
  }
}
