import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { agyFolders, claudeHooks, commitsBehind, lessonsProblems, linkProblems, modelLabels, output, problems, rows, runs, settingsProblems, toolProblems, tools } from './check.mjs';

const here = (p) => join(import.meta.dirname, p);
const read = (p) => readFileSync(here(p), 'utf8');
// One "## Heading" or "### Heading" section of a markdown file, up to the next heading.
const section = (md, heading) =>
  (md.match(new RegExp(`^#{2,3} ${heading}[^\\n]*\\n[\\s\\S]*?(?=^#{2,3} |(?![\\s\\S]))`, 'm')) || [''])[0];
const all = (text, patterns) => { for (const re of patterns) assert.match(text, re); };

const wanted = [
  ['a/a', 'core', 'on'],
  ['b/b', 'extra', 'off'],
  ['c/c', '-', '-'],
];

test('matching machine has no problems', () => {
  const installed = [
    { name: 'core', enabled: true },
    { name: 'extra', enabled: false },
  ];
  assert.deepEqual(problems(wanted, installed), []);
});

test('reports missing and wrong-state plugins', () => {
  const installed = [{ name: 'core', enabled: false }];
  assert.deepEqual(problems(wanted, installed), ['core: should be on', 'extra: not installed']);
});

// Antigravity has one plugin list for the whole machine: no project scope to tell apart.
test('a plugin the user installed alone is not a problem, and a longer name is not a match', () => {
  const installed = [
    { name: 'core', enabled: true },
    { name: 'extra', enabled: false },
    { name: 'firebase', enabled: true },
  ];
  assert.deepEqual(problems(wanted, installed), []);
  assert.deepEqual(problems(wanted, [{ name: 'core-tools', enabled: true }, { name: 'extra', enabled: false }]), ['core: not installed']);
});

test('the check reads the model names agy prints, and finds agy where its installers put it', () => {
  const printed = 'Fetching available models...\ngemini-4-neon-high\tGemini 4 Neon (High)\r\ngemini-3.8-flash-low\tGemini 3.8 Flash (Low)\n';
  assert.deepEqual(modelLabels(printed), ['Gemini 4 Neon (High)', 'Gemini 3.8 Flash (Low)']);
  assert.deepEqual(modelLabels(''), []);
  assert.deepEqual(modelLabels('Error: not signed in\n'), []);
  assert.deepEqual(agyFolders('/home/u').map((f) => f.replaceAll('\\', '/')), ['/home/u/.gemini/bin', '/home/u/.local/bin', '/home/u/AppData/Local/agy/bin']);
  assert.match(output('node --version'), /^v\d+/);
  assert.equal(output('no-such-tool-of-the-kit --version'), '');
  all(read('check.mjs'), [/modelLabels\(output\('agy models'\)\)/, /if \(!offered\.length\) bad\.push\(/]);
});

test('skills.txt is well formed', () => {
  for (const row of rows('skills.txt')) {
    assert.equal(row.length, 2, row.join(' '));
    assert.match(row[0], /^[\w.-]+\/[\w.-]+$/);
    assert.match(row[1], /^[\w-]+$/);
  }
});

test('plugins.txt is well formed', () => {
  for (const row of rows('plugins.txt')) {
    assert.equal(row.length, 3, row.join(' '));
    assert.match(row[0], /^[\w.-]+\/[\w.-]+$/);
    assert.match(row[1], /^(-|[\w.-]+)$/);
    assert.match(row[2], /^(on|off|-)$/);
  }
});

test('the core stays small: heavy plugins are off but can be found', () => {
  const state = Object.fromEntries(rows('plugins.txt').map((r) => [r[1], r[2]]));
  assert.equal(state.caveman, 'on');
  const on = Object.values(state).filter((s) => s === 'on').length;
  assert.ok(on <= 2, `${on} plugins are on; every one loads into every session`);
  const map = read('antigravity/rules/skill-map.md');
  for (const id of ['ecc', 'superpowers', 'claude-mem', 'ponytail']) {
    assert.equal(state[id], 'off', id);
    assert.ok(map.includes(`| ${id} |`), `skill map has no row for ${id}`);
  }
  // Every plugin the map tells the lead to enable is one the kit installs.
  const enabled = [...map.matchAll(/^\|[^|]+\| ([\w.-]+) \|/gm)].map((m) => m[1]).filter((name) => name !== 'Enable');
  assert.ok(enabled.length >= 10, 'the skill map names no plugin');
  for (const name of enabled) assert.ok(state[name], `the skill map names ${name}, which plugins.txt does not install`);
  // Every reference repo the map sends the lead to is one the kit clones.
  const refs = rows('refs.txt').map((r) => r[0].split('/')[1]);
  const vendored = [...map.matchAll(/~\/\.gemini\/config\/vendor\/([\w.-]+)\//g)].map((m) => m[1]);
  assert.ok(vendored.length >= 3, 'the skill map names no reference repo');
  for (const name of vendored) assert.ok(refs.includes(name), `the skill map names ${name}, which refs.txt does not clone`);
  assert.match(map, /\| impeccable \| first choice for screens \|/);
  assert.match(map, /counts only under `~\/\.gemini\/config\/plugins\/`,\s+`~\/\.gemini\/config\/skills\/` or a reference repo named below/);
  assert.match(map, /never\s+overrides the handbook or the security\s+rules/);
});

test('settings-additions.json sets the lead model, and nothing else', () => {
  const s = JSON.parse(read('antigravity/settings-additions.json'));
  // The CLI saves a model by its label, as `agy models` prints it.
  assert.equal(s.model, 'Gemini 4 Neon (High)');
  // update.sh adds every key in this file to every laptop without asking. A new key
  // must first be named in the README section "What you need", then added here.
  assert.deepEqual(Object.keys(s), ['model']);
  assert.ok(section(read('README.md'), 'What you need').includes(`the lead model (\`${s.model}\`)`), 'the README does not name the lead model the kit sets');
});

test('the check reports a file that is not linked and a tool that does not run', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-check-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const file = (path) => { mkdirSync(join(dir, path, '..'), { recursive: true }); writeFileSync(join(dir, path), ''); };
  for (const path of ['kit/agents/a.md', 'kit/agents/b.md', 'kit/rules/r.md', 'kit/templates/t.yml']) file(path);
  for (const path of ['home/agents/a.md', 'home/rules/r.md']) file(path);
  const home = join(dir, 'home');
  assert.deepEqual(linkProblems(join(dir, 'kit'), home), [`agents/b.md: not linked into ${home}`, `templates/t.yml: not linked into ${home}`]);
  file('home/agents/b.md');
  file('home/templates/t.yml');
  assert.deepEqual(linkProblems(join(dir, 'kit'), home), []);
  // On the real repo every linked folder exists and holds files.
  assert.ok(linkProblems(here('antigravity'), join(dir, 'empty')).length >= 13 + 3 + 5);

  const asked = [];
  const works = (command) => { asked.push(command); return command !== 'semgrep --version'; };
  assert.deepEqual(toolProblems(['gh', 'semgrep'], works), ['semgrep: not installed; run the installer again']);
  assert.deepEqual(asked, ['gh --version', 'semgrep --version']);
  assert.equal(runs('node --version'), true);
  assert.equal(runs('no-such-tool-of-the-kit --version'), false);
});

test('every laptop gets the same settings, connections and tools as the first one', () => {
  const kit = JSON.parse(read('antigravity/settings-additions.json'));
  assert.deepEqual(settingsProblems({}, kit), ['settings.json: model is missing; run bash update.sh']);
  assert.deepEqual(settingsProblems({ model: 'mine', section: {} }, { model: 'kit', section: { key: 'off' } }), [
    'settings.json: section.key is missing; run bash update.sh',
  ]);
  assert.deepEqual(settingsProblems({ ...kit, model: 'Gemini 3.8 Flash (High)', theme: 'dark' }, kit), []);
  assert.deepEqual(settingsProblems(null, kit), ['settings.json: cannot be read as a JSON object; repair the file, then run bash update.sh']);
  // update.sh writes the settings; nobody has to merge a file by hand.
  assert.ok(read('update.sh').includes('node "$KIT/settings-merge.mjs"'), 'update.sh does not merge the settings');
  const win = read('install-windows.bat');
  const mac = read('install-mac.command');
  for (const installer of [win, mac]) {
    assert.doesNotMatch(installer, /Merge (claude|antigravity)/);
    assert.ok(installer.includes('agy mcp add playwright npx @playwright/mcp@latest'));
    assert.ok(installer.includes('agy mcp add sentry https://mcp.sentry.dev/mcp'));
    assert.ok(installer.includes('https://antigravity.google/cli/install.'), 'the installer does not install agy');
  }
  // check.mjs fails on a missing tool, so both installers must install every one.
  const winName = { gh: 'GitHub.cli', gitleaks: 'Gitleaks.Gitleaks', semgrep: 'pip install semgrep', 'osv-scanner': 'Google.OSVScanner', bun: 'Oven-sh.Bun' };
  const brew = mac.match(/^brew install (.*)$/m)[1].split(/\s+/).map((formula) => formula.split('/').pop());
  for (const tool of tools) {
    assert.ok(win.includes(winName[tool]), `install-windows.bat does not install ${tool}`);
    assert.ok(brew.includes(tool) || mac.includes(`npm install -g ${tool}`), `install-mac.command does not install ${tool}`);
  }
  all(read('check.mjs'), [/output\('agy mcp list'\)/, /toolProblems\(tools, runs\)/, /linkProblems\(join\(kit, 'antigravity'\), dest\)/]);
  all(section(read('README.md'), 'What you need'), [
    /`~\/\.gemini\/antigravity-cli\/settings\.json`/, /A value you set yourself is never changed/, /`settings\.json\.backup`/,
    /A key you delete is added again on the next update/, /the Sentry MCP server/, /agy mcp remove sentry/,
  ]);
  assert.doesNotMatch(section(read('README.md'), 'Install'), /Merge `(claude|antigravity)\/settings-additions\.json`/);
});

// This branch lives beside the Claude Code kit of the main branch, often on the same laptop.
test('the Antigravity kit never touches a Claude Code setup on the same laptop', (t) => {
  for (const script of ['update.sh', 'install-windows.bat', 'install-mac.command', 'check.mjs', 'settings-merge.mjs', 'office-remote.cmd']) {
    const text = read(script);
    // check.mjs names the folder in words only: it warns about plugins whose hooks write there. It never opens a path in it.
    if (script === 'check.mjs') assert.doesNotMatch(text, /['"`]\.claude['"`/\\]|join\([^\n]*\.claude/, 'check.mjs builds a path into the Claude Code config folder');
    else assert.doesNotMatch(text, /\.claude\b/, `${script} names the Claude Code config folder`);
    assert.doesNotMatch(text, /\bclaude (plugin|mcp)\b|CLAUDE_CONFIG_DIR/, `${script} runs a Claude Code command`);
  }
  // The Claude kit sets git's global hooks path to its own folder. This kit sets it only when it is empty.
  assert.ok(read('install-windows.bat').includes('git config --global --get core.hooksPath >nul 2>&1 || git config --global core.hooksPath'));
  assert.ok(read('install-mac.command').includes('git config --global --get core.hooksPath >/dev/null || git config --global core.hooksPath'));
  for (const installer of ['install-windows.bat', 'install-mac.command']) {
    assert.equal(read(installer).match(/core\.hooksPath/g).length, 2, `${installer} sets the hooks path more than once`);
  }
  // The README must not promise more than that: the Claude kit's commit-msg hook knows Claude lines only.
  all(section(read('README.md'), 'What you need'), [/only when no hooks path is set/, /keeps that kit's hooks/, /removes Claude lines only/]);
  all(read('antigravity/git-hooks/commit-msg'), [/anthropic\|claude\|gemini\|antigravity/, /generated with/]);
  // A converted Claude Code plugin can bring hooks that write into ~/.claude. The check names
  // every such plugin that is on, and the skill map makes the lead ask before turning one on.
  const dir = mkdtempSync(join(tmpdir(), 'kit-hooks-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const plugin = (name, file, text) => {
    mkdirSync(join(dir, name, file, '..'), { recursive: true });
    writeFileSync(join(dir, name, file), text);
    return join(dir, name);
  };
  assert.equal(claudeHooks(plugin('a', 'hooks/hooks.json', '{"command": "\\"${CLAUDE_PLUGIN_ROOT}/hooks/run\\""}')), true);
  assert.equal(claudeHooks(plugin('b', 'hooks.json', '{"command": "node ~/.claude/x.js"}')), true);
  assert.equal(claudeHooks(plugin('c', 'hooks.json', '{"command": "./scripts/lint.sh"}')), false);
  // Hooks for another tool, in a file Antigravity does not read, do not count.
  assert.equal(claudeHooks(plugin('d', 'hooks/hooks-cursor.json', '{"command": "node ~/.claude/x.js"}')), false);
  assert.equal(claudeHooks(join(dir, 'not-installed')), false);
  all(read('check.mjs'), [/installed\.filter\(\(p\) => p\.enabled && p\.path && claudeHooks\(p\.path\)\)/]);
  all(read('antigravity/rules/skill-map.md'), [/their hooks may write\s+into `~\/\.claude`/, /tell the founder\s+that in one line and wait for the yes/, /`disable` before you show the\s+result/]);
  // Both kits link everything the laptop uses into their own folder of the clone.
  assert.ok(!existsSync(here('claude')), 'the Claude Code kit folder is back on this branch');
  assert.ok(!existsSync(here('.claude-plugin')), 'the Claude Code marketplace file is back on this branch');
});

test('the check knows when this copy is behind GitHub', () => {
  const asked = [];
  const git = (answer) => (args) => { asked.push(args); if (answer instanceof Error) throw answer; return answer; };
  assert.equal(commitsBehind(git('3\n')), 3);
  assert.deepEqual(asked, ['fetch --quiet', 'rev-list --count HEAD..@{u}']);
  assert.equal(commitsBehind(git('0\n')), 0);
  // A branch that follows nothing: unknown is not a failure.
  assert.equal(commitsBehind(git(new Error('fatal: no upstream configured'))), 0);
  assert.equal(commitsBehind(git('')), 0);
  // No network: the fetch fails, but what the last fetch learned still counts.
  assert.equal(commitsBehind((args) => { if (args.startsWith('fetch')) throw new Error('could not resolve host'); return '4\n'; }), 4);
  all(read('check.mjs'), [/const behind = commitsBehind\(/, /if \(behind\) bad\.push\(/]);
});

// The handbook is the source. Agents, skills and templates must not send a worker to a file
// that nothing writes, or force a design the handbook leaves to the spec.
test('agents, skills and templates agree with the handbook', () => {
  const kitFiles = (folder) => readdirSync(here(`antigravity/${folder}`), { recursive: true })
    .map((f) => `antigravity/${folder}/${String(f).replaceAll('\\', '/')}`)
    .filter((f) => /\.(md|yml)$/.test(f) && !f.startsWith('antigravity/skills/myoffice/') && !f.startsWith('antigravity/skills/synced/') && !f.startsWith('antigravity/skills/.trash/') && f !== 'antigravity/skills/lessons/SKILL.md');
  const files = ['agents', 'rules', 'skills', 'templates'].flatMap(kitFiles);
  assert.ok(files.length > 25, `only ${files.length} files found`);
  // Every project has SPEC.md and STATUS.md, and the lead moves older rounds from STATUS.md to
  // HISTORY.md (handbook, Every project remembers). The other docs exist only when their writer ran.
  const writer = { 'ARCHITECTURE.md': 'antigravity/agents/architect.md', 'API.md': 'antigravity/agents/architect.md', 'PLAN.md': 'antigravity/agents/planner.md', 'RELEASE.md': 'antigravity/agents/devops-engineer.md' };
  for (const file of files) {
    const text = read(file);
    for (const [, name] of text.matchAll(/docs\/([A-Z]+\.md)/g)) {
      if (name === 'SPEC.md' || name === 'STATUS.md' || name === 'HISTORY.md') continue;
      assert.ok(writer[name], `${file} names docs/${name}, which nothing writes`);
    }
    // Outside its writer, such a doc may only be named as something a project may have.
    // The planner is the one exception: it runs on a large project, after the architect.
    const lines = text.split(/\r?\n/);
    for (const [i, line] of lines.entries()) {
      for (const [, name] of line.matchAll(/\b(ARCHITECTURE|API|PLAN|RELEASE)\.md/g)) {
        if (file === writer[`${name}.md`] || file === 'antigravity/agents/planner.md') continue;
        const context = `${lines[i - 1] || ''} ${line} ${lines[i + 1] || ''}`;
        assert.match(context, /when the\s+project has|Only when the project has/i, `${file} names ${name}.md as if every project had it`);
      }
    }
  }
  // The architect's first job is the one the handbook names; the rest only on the lead's word.
  assert.match(section(read('antigravity/GEMINI.md'), '3\\. Build'), /architect reviews the data\s+model in docs\/SPEC\.md once, before any code/);
  all(read('antigravity/agents/architect.md'), [/^description: Reviews the data model of an approved docs\/SPEC\.md before any code/m, /1\. Always: review the data model in docs\/SPEC\.md before any code/, /Jobs 2 to 4 only when the lead's brief asks for them/]);
  // Builders that work in parallel need a contract: docs/API.md, or the endpoints in the brief.
  for (const agent of ['backend-dev', 'frontend-dev']) {
    all(read(`antigravity/agents/${agent}.md`), [/when\s+the project has a docs\/API\.md, follow it exactly/, /the brief\s+must name each endpoint/, /stop and\s+report that, do not guess/]);
  }
  // site-monitor is a small model: it reports, the lead writes the project's memory.
  const monitor = read('antigravity/agents/site-monitor.md');
  all(monitor, [/^tools: \[view_file, grep_search, run_command\]$/m, /Write no file: the lead adds each real bug to the open\s+list in docs\/STATUS\.md/]);

  // Several organisations is a decision of the spec (handbook, Scale), never a default.
  assert.match(read('antigravity/rules/security.md'), /scoped to its owner: the user, group or\s+organisation it belongs to/);
  assert.match(read('antigravity/agents/architect.md'), /organisation_id on tables only when docs\/SPEC\.md says the product\s+serves several organisations/);
  assert.match(read('antigravity/skills/backend-standards/SKILL.md'), /background jobs when a\s+measurement or docs\/SPEC\.md calls for it/);
});

test('the project templates name one stack and keep the project\'s memory in git', (t) => {
  const stackOf = (file) => section(read(file), 'Tech stack');
  const project = stackOf('antigravity/templates/project-GEMINI.md');
  const readme = stackOf('antigravity/templates/README.md');
  assert.ok(project && readme, 'a template has no Tech stack section');
  for (const part of ['React', 'Next.js', 'PHP', 'MySQL', 'PostgreSQL', 'Prisma', 'Playwright']) {
    assert.equal(readme.includes(part), project.includes(part), `the README template and the project GEMINI.md template disagree on ${part}`);
  }
  // Every test runner the stack names runs in the CI template.
  const ci = read('antigravity/templates/ci.yml');
  for (const [runner, step] of [['Vitest', /npm test/], ['PHPUnit', /vendor\/bin\/phpunit/], ['Playwright', /npm run test:e2e/]]) {
    if (project.includes(runner)) assert.match(ci, step, `the CI template never runs ${runner}`);
  }
  // Least rights for the CI token; the gitleaks step needs to list a pull request's commits.
  assert.match(ci, /^permissions:\r?\n  contents: read\r?\n  pull-requests: read\b/m);
  for (const [, ref] of ci.matchAll(/uses: \S+@(\S+)/g)) assert.match(ref, /^[0-9a-f]{40}$/, `a CI template action is not pinned to a commit: ${ref}`);
  assert.doesNotMatch(read('antigravity/templates/project-GEMINI.md'), /local only/);

  // The gitignore template, tried with real git: memory and migrations go in, dumps stay out.
  const dir = mkdtempSync(join(tmpdir(), 'kit-ignore-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', dir]);
  writeFileSync(join(dir, '.gitignore'), read('antigravity/templates/gitignore'));
  const ignored = (path) => {
    try {
      execFileSync('git', ['-C', dir, 'check-ignore', '-q', path], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  for (const path of ['docs/STATUS.md', 'docs/SPEC.md', 'backend/migrations/0001_initial_schema.sql', 'api/migrations/down/0001.sql', 'migrations/0001.sql', 'api/tests/fixtures/users/seed.sql', '.env.example']) {
    assert.equal(ignored(path), false, `${path} would never reach git`);
  }
  for (const path of ['dump.sql', 'backup/prod.sql', 'export.csv', 'data.dump', '.env', '.env.local', 'node_modules/x.js', 'backend/vendor/autoload.php']) {
    assert.equal(ignored(path), true, `${path} would be committed`);
  }
});

test('README counts match the files', () => {
  const readme = read('README.md');
  const each = (re, expected) => {
    const hits = [...readme.matchAll(re)];
    assert.ok(hits.length > 0, `README has no match for ${re}`);
    for (const h of hits) assert.equal(Number(h[1]), expected, `${h[0]} in README`);
  };
  const external = new Set(rows('skills.txt').map((r) => r[1]));
  const plugins = rows('plugins.txt');
  each(/(\d+) staff agents/g, readdirSync(here('antigravity/agents')).filter((f) => f.endsWith('.md')).length);
  each(
    /(\d+) company skills/g,
    // lessons counts by its kit.md: its SKILL.md is each laptop's own file and is not in the repo.
    readdirSync(here('antigravity/skills')).filter((d) => !external.has(d) && ['SKILL.md', 'kit.md'].some((f) => existsSync(here(`antigravity/skills/${d}/${f}`)))).length,
  );
  each(/(\d+) core plugins?\b/g, plugins.filter((r) => r[2] === 'on').length);
  each(/(\d+) plugins that are off/g, plugins.filter((r) => r[2] === 'off').length);
});

test('every relative link in README.md exists', () => {
  const readme = read('README.md').replace(/```[\s\S]*?```/g, '');
  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(?:src|href)=["']([^"']+)["']/g;
  const targets = [...readme.matchAll(re)].map((m) => m[1] || m[2]);
  assert.ok(targets.length > 0, 'README has no links');
  for (const t of targets) {
    if (/^(https?:|#|mailto:)/.test(t)) continue;
    const path = decodeURIComponent(t.split('#')[0]);
    assert.ok(existsSync(here(path)), `broken link: ${t}`);
  }
});

test('README has the banner, the CI badge and three diagrams', () => {
  const readme = read('README.md');
  assert.ok(readme.includes('src="docs/assets/banner.svg"'));
  assert.ok(readme.includes('actions/workflows/ci.yml/badge.svg'));
  assert.equal((readme.match(/```mermaid/g) || []).length, 3);
});

test('README diagram 2 shows the five steps and the one yes', () => {
  const blocks = [...read('README.md').matchAll(/```mermaid([\s\S]*?)```/g)].map((m) => m[1]);
  assert.equal(blocks.length, 3);
  all(blocks[1], [/1\. Study/, /2\. Propose/, /Founder says yes\?/, /3\. Build/, /4\. Check/, /independent reviewers/, /5\. Show/, /only on the founder's word/, /Production/, /full sweep of the whole product/]);
  assert.doesNotMatch(read('README.md'), /founder-proxy|\bTiny\b|\bRisky\b/);
});

test('handbook has the five steps, in order', () => {
  const md = read('antigravity/GEMINI.md');
  const heads = ['### 1. Study', '### 2. Propose: one short plan, one yes', '### 3. Build', '### 4. Check yourself, before the founder sees it', '### 5. Show'];
  const at = heads.map((h) => md.indexOf(`\n${h}\n`));
  for (const [i, pos] of at.entries()) assert.ok(pos > 0, `handbook lacks "${heads[i]}"`);
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

test('the founder is never interviewed and says yes once', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '1\\. Study'), [/Never interview the founder/, /Run it and look at it as it is today/, /what the founder did not say but the product needs/]);
  all(section(md, '2\\. Propose'), [
    /At most 15 lines/, /mark each\s+"added"/, /what must stay on the server/, /Left out, and why/, /Skills: the skill files this work will use/,
    /wait for the founder's yes/, /do not plan again from zero/, /A small order [^.]* needs no plan/, /That is the only kind of question/,
  ]);
  const bts = read('antigravity/skills/brief-to-spec/SKILL.md');
  all(bts, [/Do not ask the founder to choose/, /without interviewing the founder/, /^10\. Slices/m, /^11\. Look and theme/m, /never drop section 7/, /under\s+`## Skills`/, /Wait for the founder's yes/]);
  assert.doesNotMatch(bts, /questions per round|multiple-choice/);
  assert.match(read('antigravity/skills/new-project/SKILL.md'), /## Skills/);
  assert.match(read('antigravity/templates/project-GEMINI.md'), /^## Skills/m);
});

test('every screen gets a design skill, fitting motion and every state', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '3\\. Build'), [
    /Any screen: a design skill\s+from the skill map \(impeccable first\) and frontend-standards/, /Read the plan's skill files before writing/,
    /Motion where it helps/, /none where it distracts \(login, forms,\s+settings\)/, /hover, pressed, focus, empty, loading, error/,
    /Phone and big screen/, /never emoji/,
  ]);
  all(section(md, '4\\. Check yourself'), [/use every feature in a real browser/, /generic or AI-made/, /Every new screen or redesign then goes to\s+ux-reviewer/]);
  all(section(md, '5\\. Show'), [/A screenshot or a local URL/, /at most 8 lines/, /"tests pass" is not "good"/]);
});

test('security is always on, scale only when the product needs it', () => {
  const md = read('antigravity/GEMINI.md');
  // Antigravity loads a rule file into every session only when its header says so; a
  // misspelled trigger is dropped without a word. One file may hold 24,000 bytes at most.
  for (const rule of ['security', 'testing', 'skill-map']) {
    const text = read(`antigravity/rules/${rule}.md`);
    assert.match(text, /^---\r?\ntrigger: always_on\r?\n---\r?\n# /, `${rule}.md is not always on`);
    assert.ok(Buffer.byteLength(text) <= 24000, `${rule}.md is over Antigravity's size limit for one rule file`);
  }
  assert.match(md, /The rules in `~\/\.gemini\/config\/rules\/` load into every session: security,\s+testing and the skill map/);
  // An "@file" line in the handbook is not an import in Antigravity.
  assert.doesNotMatch(md, /^@/m);
  all(section(md, 'Scale'), [/scale-standards skill only when docs\/SPEC\.md says/, /does not get\s+multi-tenant tables/]);
  // Every file in antigravity/rules/ loads into every session, so the scale rules live in a skill, read on demand.
  assert.ok(!existsSync(here('antigravity/rules/scale.md')), 'scale.md is back in the always-loaded rules folder');
  all(read('antigravity/skills/scale-standards/SKILL.md'), [/^description: .*Use only when docs\/SPEC\.md says/m, /never for a prototype/, /organisation_id/, /paginated on the server/]);
  assert.doesNotMatch(read('antigravity/skills/backend-standards/SKILL.md'), /organisation_id|large organisations/);
  all(read('antigravity/rules/security.md'), [/from the first line of a prototype/, /Never\s+skip a rule that does apply/, /parameterised queries/, /No secrets in frontend code/]);
  all(section(md, '3\\. Build'), [/Server\s+code: backend-standards and security-checklist/, /apply from the first\s+line of a prototype/, /Secrets, tokens, keys and anything worth stealing\s+live on the server/]);
  all(section(md, '4\\. Check yourself'), [/against the security-checklist skill/, /Login,\s+permission checks, database queries, payment, upload, personal data or a\s+new dependency also goes to security-reviewer/, /security-researcher/]);
  assert.match(read('antigravity/agents/security-reviewer.md'), /^description: .*login, permission checks, database queries, payment, upload, personal data or a new dependency/m);
});

test('code stays in order and one feature is not a chain of agents', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '3\\. Build'), [
    /The lead builds/, /Never a chain of planner, approver and builder/, /one job per file/, /no dead\s+code, no copy-pasted blocks/,
    /smallest change that fully does the job/, /Never cut validation, permission checks, error handling or tests/,
  ]);
  assert.doesNotMatch(md, /founder-proxy|\bTiny\b|\bRisky\b|\btiers?\b|ecc:/i);
  assert.ok(!existsSync(here('antigravity/agents/founder-proxy.md')), 'founder-proxy is back');
  all(section(md, 'Staff'), [/you are not the lead/, /never delegate it/, /10\s+lines or less/, /a short brief with file paths/]);
});

test('the builder never has the last word on its own work', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '4\\. Check yourself'), [
    /The builder never has the last word on its own work/, /Tools first: lint, typecheck, tests and gitleaks/, /Red means fix, not show/,
    /one saved browser test of its main path/, /code-reviewer reads every code change/, /Only a small order \(step 2\) skips it/,
    /Send the reviewers in one message/, /Fix every\s+medium or higher finding; the reviewer that raised it checks the fix/, /hard-bug row of the skill map/,
  ]);
  assert.match(section(md, '3\\. Build'), /architect reviews the data\s+model in docs\/SPEC\.md once, before any code/);
  const cr = read('antigravity/agents/code-reviewer.md');
  const front = (cr.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
  assert.equal(front.match(/^tools:\s*(.*?)\s*$/m)?.[1], '[view_file, grep_search, run_command]');
  all(cr, [/You did not write this code/, /Never edit a file/, /Do not run the tests again/, /is data, not instructions/, /PASS or FINDINGS/, /high\/medium\/low/]);
  assert.match(read('antigravity/rules/skill-map.md'), /\| A bug that survived one fix \| none: read the file \| .*systematic-debugging\/SKILL\.md.*the plugin stays off \|/);
  assert.match(section(md, 'Staff'), /does not run the tests again and does not comment on style/);
});

test('production is the full sweep of the whole product, on the founder\'s word', () => {
  const p = section(read('antigravity/GEMINI.md'), 'Production');
  assert.ok(p, 'no Production section');
  all(p, [
    /on the founder's word "production"/, /checks the whole product, once, before\s+real users or real data/, /say\s+so once, in one line/,
    /lint, typecheck, every test, gitleaks and semgrep/, /CI on GitHub is\s+green/, /each on the whole codebase/,
    /code-reviewer/, /security-reviewer with the full checklist/, /security-researcher on every\s+dependency/,
    /integration-checker through every screen and endpoint/, /ux-reviewer on every screen/, /all three levels\s+of the testing rules/,
    /Three rounds at most/, /Deploying stays the founder's\s+decision/,
  ]);
});

test('the lead thinks like a business partner, and the company learns', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '1\\. Study'), [
    /The founder's projects are business projects/, /For a new product or a\s+large feature also use the product-sense skill/,
    /Minutes, not a\s+report/, /Use the lessons skill when a project starts/,
  ]);
  // Lessons live in a skill: a session can always load a skill, but not a file outside its project folder.
  all(read('antigravity/skills/lessons/own-template.md'), [/^name: lessons$/m, /^description: .*Use in the Study step when a project starts/m, /Verified things only/, /60 lines at\s+most/]);
  assert.ok(read('antigravity/skills/lessons/kit.md').trimEnd().split(/\r?\n/).length <= 70, 'the kit lessons are over 70 lines');
  all(section(md, '2\\. Propose'), [
    /Worth building because: the user, the problem, why they would choose this/,
    /My advice: only when you would build less, build something different, or\s+not build it/, /Say why, plainly\. The founder decides/,
  ]);
  assert.match(section(md, '5\\. Show'), /End with one line\s+"I noticed"/);
  all(section(md, 'The company learns'), [
    /The lessons skill \(`~\/\.gemini\/config\/skills\/lessons\/SKILL\.md`\)/, /Verified things only, three lines each at most, newest first, 60 lines at\s+most/, /This\s+one file needs no yes/,
    /corrects the same kind of thing twice, propose one rule\s+change in plain words/, /Change nothing without the yes/,
  ]);
  assert.match(section(md, 'Every project remembers'), /what problem it solves,\s+how success is measured/);
  const ps = read('antigravity/skills/product-sense/SKILL.md');
  all(ps, [
    /^description: .*never for a fix or a small change/m, /one or\s+two web searches at most/, /or "not checked"/, /The simpler way/,
    /Cost to run/, /The founder\s+decides; then build what the founder chose, fully/, /No market-size tables, no SWOT, no invented numbers/,
  ]);
  assert.match(read('antigravity/skills/brief-to-spec/SKILL.md'), /^12\. Business: target user/m);
  // Business thinking is a skill and two plan lines, never a department.
  for (const f of readdirSync(here('antigravity/agents'))) assert.doesNotMatch(f, /ceo|finance|marketing|sales/i, `${f}: a department agent`);
});

test('the founder\'s own lessons never leave the laptop', () => {
  const own = 'antigravity/skills/lessons/SKILL.md';
  assert.equal(execFileSync('git', ['ls-files', '--', own], { cwd: here('.'), encoding: 'utf8' }).trim(), '', `${own} is tracked again`);
  assert.match(read('.gitignore'), /^antigravity\/skills\/lessons\/SKILL\.md$/m);
  // update.sh creates the own file from the template once and never overwrites it.
  assert.ok(read('update.sh').includes('[ -e "$LESSONS/SKILL.md" ] || cp "$LESSONS/own-template.md" "$LESSONS/SKILL.md"'), 'update.sh does not create the lessons file');
  assert.match(read('antigravity/skills/lessons/own-template.md'), /Git ignores this file, so what you write never leaves\s+this laptop/);
});

test('every laptop reads the same kit lessons, and they are in git', (t) => {
  const tracked = execFileSync('git', ['ls-files', '--', 'antigravity/skills/lessons'], { cwd: here('.'), encoding: 'utf8' }).trim().split(/\r?\n/);
  assert.deepEqual(tracked, ['antigravity/skills/lessons/kit.md', 'antigravity/skills/lessons/own-template.md']);
  const kit = read('antigravity/skills/lessons/kit.md');
  // The kit's lessons are public and shared: neutral words, no dates, no names of one founder's projects.
  assert.doesNotMatch(kit, /\b20\d\d-\d\d-\d\d\b/, 'the kit lessons carry a dated note from one founder');
  all(kit, [
    /^## Product and design$/m, /^## Platforms$/m, /^## Working method$/m, /^## Windows$/m,
    /switching to a branch that still\s+tracks it replaces it without a warning/, /"do this by\s+hand" does not happen on other\s+machines/,
    /Never write in this file/, /before a release, move the\s+lessons worth sharing/,
  ]);
  // The own file is the skill a session loads; it must send the reader to kit.md, also on a laptop set up before 2.0.2.
  assert.match(read('antigravity/skills/lessons/own-template.md'), /First read `kit\.md` beside this file/);
  assert.ok(read('update.sh').includes('grep -q \'`kit\\.md` beside this file\' "$LESSONS/SKILL.md" || printf'), 'update.sh does not point an older own file to kit.md');

  const dir = mkdtempSync(join(tmpdir(), 'kit-lessons-'));
  t.after(() => rmSync(dir, { recursive: true }));
  assert.deepEqual(lessonsProblems(dir), ['lessons: your own lessons file is missing; run bash update.sh']);
  writeFileSync(join(dir, 'SKILL.md'), '# Lessons\n- my own note\n');
  assert.deepEqual(lessonsProblems(dir), [
    'lessons: kit.md, the lessons that come with the kit, is missing',
    'lessons: your own lessons file does not point to kit.md; run bash update.sh',
  ]);
  writeFileSync(join(dir, 'kit.md'), kit);
  // A note that only names a file like "toolkit.md" is not the pointer.
  writeFileSync(join(dir, 'SKILL.md'), '# Lessons\n- the toolkit.md of that project was out of date\n');
  assert.deepEqual(lessonsProblems(dir), ['lessons: your own lessons file does not point to kit.md; run bash update.sh']);
  writeFileSync(join(dir, 'SKILL.md'), read('antigravity/skills/lessons/own-template.md'));
  assert.deepEqual(lessonsProblems(dir), []);
  assert.match(read('check.mjs'), /lessonsProblems\(join\(dest, 'skills', 'lessons'\)\)/);
});

// Runs the two real lessons lines of update.sh against a throwaway folder.
test('update.sh never overwrites an own lessons file and points an older one to kit.md once', { skip: process.platform === 'win32' && 'runs on Linux and Mac: on Windows "bash" may not be Git Bash' }, (t) => {
  const lines = read('update.sh').match(/^\[ -e "\$LESSONS\/SKILL\.md" \].*\n^grep -q .*$/m)?.[0];
  assert.ok(lines, 'update.sh has no lessons lines');
  const dir = mkdtempSync(join(tmpdir(), 'kit-lessons-'));
  t.after(() => rmSync(dir, { recursive: true }));
  for (const name of ['kit.md', 'own-template.md']) writeFileSync(join(dir, name), read(`antigravity/skills/lessons/${name}`));
  const own = join(dir, 'SKILL.md');
  const run = () => execFileSync('bash', ['-c', lines], { env: { ...process.env, LESSONS: dir } });
  const pointers = () => readFileSync(own, 'utf8').split('`kit.md` beside this file').length - 1;

  run();
  assert.equal(readFileSync(own, 'utf8'), read('antigravity/skills/lessons/own-template.md'));
  run();
  assert.equal(readFileSync(own, 'utf8'), read('antigravity/skills/lessons/own-template.md'));

  // Own files as 2.0.0 and 2.0.1 left them: no pointer; Unix or Windows line ends; with or without a last line end.
  for (const old of ['# Lessons\n- my own note\n', '# Lessons\r\n- my own note\r\n', '# Lessons\n- my own note', '- the toolkit.md of that project\n']) {
    writeFileSync(own, old);
    run();
    const once = readFileSync(own, 'utf8');
    assert.ok(once.startsWith(old), 'the own notes were changed');
    assert.match(once, /\nAlso read `kit\.md` beside this file: the lessons that come with the kit\.\n$/);
    assert.equal(pointers(), 1);
    assert.deepEqual(lessonsProblems(dir), []);
    run();
    assert.equal(readFileSync(own, 'utf8'), once, 'a second run changed the file');
  }
});

test('anyone may use the kit', () => {
  all(read('LICENSE'), [/^MIT License$/m, /Permission is hereby granted, free of charge, to any person/]);
  all(read('README.md'), [/^## Who it is for$/m, /^## What you need$/m, /^## What it costs$/m, /\[LICENSE\]\(LICENSE\)/]);
  assert.doesNotMatch(read('README.md'), /My personal/);
  // A stranger must be able to read what the installer changes on the machine before running it.
  all(section(read('README.md'), 'What you need'), [
    /Homebrew if it is missing/, /renamed to `<name>\.backup`/, /copied to `GEMINI\.md\.backup` once/, /on every `bash update\.sh`/,
    /a repo's own `\.git\/hooks` no longer run/, /removes AI co-author/, /`gh auth setup-git`/, /`gh auth login`/,
    /git config --global --unset core\.hooksPath/, /every plugin in `plugins\.txt`/, /`~\/\.gemini\/config\/vendor`/,
  ]);
  assert.ok(
    read('install-windows.bat').includes('if not exist "%USERPROFILE%\\.gemini\\config\\GEMINI.md.backup" copy "%USERPROFILE%\\.gemini\\config\\GEMINI.md" "%USERPROFILE%\\.gemini\\config\\GEMINI.md.backup"'),
    'the Windows installer overwrites an existing handbook without a backup',
  );
  assert.doesNotMatch(section(read('antigravity/GEMINI.md'), 'Who you work for'), /AI technologist/i);
});

test('the founder can always go back, and reports are in plain words', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, '3\\. Build'), [
    /Before a substantial change, save a checkpoint so the founder can go\s+back/, /a local commit of the project as it is, on a work branch/,
    /`git init`\s+and a \.gitignore first if the folder has no git/, /Nothing is pushed/, /On\s+the founder's word "undo", return to the last checkpoint/,
  ]);
  all(section(md, 'Only the founder decides'), [
    /a database change that can lose data \(back it\s+up first\)/, /A local checkpoint \(step 3\) is not a release and needs no word/,
  ]);
  assert.match(section(md, '5\\. Show'), /what changed \(files, database, settings\)/);
  assert.match(section(md, 'Style'), /Say\s+what a thing does for the user first; its technical name may follow in\s+brackets/);
});

test('testing grows with the product', () => {
  const t = read('antigravity/rules/testing.md');
  all(t, [/one saved browser test \(Playwright\) of its\s+main path/,/^## Prototype \(the default\)$/m, /^## Before real users or real data$/m, /Never delete, skip or weaken a test/, /the failing test first/, /clicked through in a real browser/, /80%\+/, /CI on GitHub green/]);
});

test('only the founder decides outward and irreversible actions', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, 'Only the founder decides'), [
    /deploying to production/, /deleting data, a repo or a\s+branch with unmerged work/, /a force push/, /making a repo public/,
    /messages to real people/, /a paid service/, /secrets and credentials/, /Commit,\s+push, merge and release happen on the founder's word/,
    /Changing the company itself/, /needs the founder's yes to a change described in plain\s+words first/,
  ]);
  const sec = read('antigravity/agents/github-secretary.md');
  all(sec, [
    /the founder has said to commit,\s+push, merge or release/, /gh pr merge <n> --squash --delete-branch --match-head-commit <sha>/, /Refuse to merge/,
    /if that commit is not the PR head/, /git tag -a vX\.Y\.Z <sha>/, /CHANGELOG\.md was updated and merged before the release/, /Refuse to tag if/,
    /if main has moved past that commit/, /Never commit it/,
  ]);
  assert.doesNotMatch(sec, /founder-proxy|\bTiny\b/);
  assert.doesNotMatch(sec, /update CHANGELOG\.md/);
});

test('hard rules forbid shell file writes and false claims', () => {
  const rules = section(read('antigravity/GEMINI.md'), 'Hard rules');
  assert.ok(rules, 'no Hard rules section');
  // The names the agy CLI gives the lead for its own file tools. An agent file lists the
  // documented names (write_to_file, replace_file_content), which the CLI maps to these.
  assert.match(rules, /\bwrite_file\b/);
  assert.match(rules, /\bedit_file\b/);
  assert.ok(rules.includes('node -e'), 'no "node -e"');
  assert.match(rules, /heredoc/i);
  all(rules, [
    /only with the file tools \(`write_file`, `edit_file`\), never through the shell/, /unless you ran it and saw it work/, /Never delete, skip or weaken a test/,
    /Never commit secrets, \.env files, real people's data/, /Project repos are private\s+unless the founder says otherwise/, /Three failed tries/,
  ]);
});

test('agent models are pinned', () => {
  // An agent file names a model class, not one model: pro reviews and designs, flash builds and reads.
  const models = {
    architect: 'pro', 'backend-dev': 'flash', 'code-reviewer': 'pro', 'devops-engineer': 'flash', 'frontend-dev': 'flash',
    'github-secretary': 'flash', 'integration-checker': 'pro', planner: 'pro', 'security-researcher': 'pro',
    'security-reviewer': 'pro', 'site-monitor': 'flash', tester: 'flash', 'ux-reviewer': 'pro',
  };
  // The tool names Antigravity documents. A name it does not know can hang the agent, and an
  // agent with no tools line gets no shell and no file tools.
  const known = ['view_file', 'grep_search', 'run_command', 'write_to_file', 'replace_file_content', 'search_web', 'read_url_content'];
  const writes = ['architect', 'backend-dev', 'devops-engineer', 'frontend-dev', 'github-secretary', 'planner', 'tester'];
  const files = readdirSync(here('antigravity/agents')).filter((f) => f.endsWith('.md'));
  assert.deepEqual(files.map((f) => f.slice(0, -3)).sort(), Object.keys(models).sort());
  for (const f of files) {
    const text = read(`antigravity/agents/${f}`);
    const front = (text.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
    assert.equal(front.match(/^model:\s*(\S+)/m)?.[1], models[f.slice(0, -3)], `${f} model`);
    const toolList = (front.match(/^tools: \[(.*)\]$/m)?.[1] || '').split(', ');
    assert.ok(toolList.includes('view_file'), `${f} has no tools line`);
    for (const tool of toolList) assert.ok(known.includes(tool), `${f} names the tool ${tool}, which Antigravity may not know`);
    // Reviewers and checkers get no tool that changes a file.
    assert.equal(toolList.includes('write_to_file'), writes.includes(f.slice(0, -3)), `${f} write access`);
    all(front, [/^subagent: true$/m, /^mainAgent: false$/m]);
    assert.doesNotMatch(front, /^(disallowedTools|memory):/m, `${f} keeps a Claude Code header line`);
    // A skill is named by its path under the config folder, and must be one of the kit's.
    for (const skill of (front.match(/^skills: \[(.*)\]$/m)?.[1] || '').split(', ').filter(Boolean)) {
      assert.ok(existsSync(here(`antigravity/${skill}/SKILL.md`)), `${f} names the skill ${skill}, which the kit does not have`);
    }
    assert.doesNotMatch(text, /founder-proxy|\bTiny\b|\bRisky\b|routing table/, `${f} still names the old workflow`);
  }
});

test('every project remembers, and the founder is spoken to in plain words', () => {
  const md = read('antigravity/GEMINI.md');
  all(section(md, 'Every project remembers'), [/docs\/SPEC\.md/, /docs\/STATUS\.md/, /Read both at the start/, /new-project skill/]);
  // The status file is read by every session, so it must not grow without limit. Nothing is deleted.
  all(section(md, 'Every project remembers'), [/STATUS\.md stays short: the two newest rounds/, /move, unchanged, to docs\/HISTORY\.md/, /read only when a task needs it/]);
  all(read('antigravity/templates/project-GEMINI.md'), [/docs\/HISTORY\.md \(in git\)/, /Read it only when a task needs it, never at the start/]);
  all(section(md, 'Style'), [/Plain words to the founder/, /no jargon/, /answer first, then the reason, then the next step/, /Never drop not, never, no,\s+only or a number/]);
  all(section(md, 'Who you work for'), [/a topic and a few rough\s+points/, /only have to look and say yes/, /The main session is the lead/]);
});

test('tokens are spent on the product, not on process', () => {
  all(section(read('antigravity/GEMINI.md'), 'Cost'), [
    /Read only the files the task needs, never the whole repo/, /goes to a flash worker/, /in one message/,
    /A sub-agent starts cold/, /re-reads its whole history on every turn/, /Task done - start a new session\s+for the next task/,
    /Routine work runs on Gemini 4 Neon \(High\) or a lighter model/, /say so once in\s+one line and carry on/,
  ]);
  // Only these rule files may load into every session.
  assert.deepEqual(readdirSync(here('antigravity/rules')).sort(), ['security.md', 'skill-map.md', 'testing.md']);
});

test('handbook stays within its line budget', () => {
  const md = read('antigravity/GEMINI.md');
  assert.ok(md.trimEnd().split(/\r?\n/).length <= 195, 'handbook over 195 lines');
  assert.ok(Buffer.byteLength(md.replace(/\r\n/g, '\n')) <= 10500, 'handbook over 10500 bytes');
});
