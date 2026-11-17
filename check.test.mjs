import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { linkProblems, problems, rows, runs, settingsProblems, toolProblems, tools } from './check.mjs';

const here = (p) => join(import.meta.dirname, p);
const read = (p) => readFileSync(here(p), 'utf8');
// One "## Heading" or "### Heading" section of a markdown file, up to the next heading.
const section = (md, heading) =>
  (md.match(new RegExp(`^#{2,3} ${heading}[^\\n]*\\n[\\s\\S]*?(?=^#{2,3} |(?![\\s\\S]))`, 'm')) || [''])[0];
const all = (text, patterns) => { for (const re of patterns) assert.match(text, re); };

const wanted = [
  ['a/a', 'core@a', 'on'],
  ['b/b', 'extra@b', 'off'],
  ['c/c', '-', '-'],
];

test('matching machine has no problems', () => {
  const installed = [
    { id: 'core@a', scope: 'user', enabled: true },
    { id: 'extra@b', scope: 'user', enabled: false },
  ];
  assert.deepEqual(problems(wanted, installed), []);
});

test('reports missing and wrong-state plugins', () => {
  const installed = [{ id: 'core@a', scope: 'user', enabled: false }];
  assert.deepEqual(problems(wanted, installed), ['core@a: should be on', 'extra@b: not installed']);
});

test('a project-scope install does not count', () => {
  const installed = [
    { id: 'core@a', scope: 'project', enabled: true },
    { id: 'extra@b', scope: 'user', enabled: false },
  ];
  assert.deepEqual(problems(wanted, installed), ['core@a: not installed']);
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
    assert.match(row[1], /^(-|[\w.-]+@[\w.-]+)$/);
    assert.match(row[2], /^(on|off|-)$/);
  }
});

test('the core stays small: heavy plugins are off but can be found', () => {
  const state = Object.fromEntries(rows('plugins.txt').map((r) => [r[1], r[2]]));
  assert.equal(state['caveman@caveman'], 'on');
  const on = Object.values(state).filter((s) => s === 'on').length;
  assert.ok(on <= 2, `${on} plugins are on; every one loads into every session`);
  const map = read('claude/rules/skill-map.md');
  for (const id of ['ecc@ecc', 'superpowers@superpowers-dev', 'claude-mem@thedotmack', 'ponytail@ponytail']) {
    assert.equal(state[id], 'off', id);
    assert.ok(map.includes(`| ${id} |`), `skill map has no row for ${id}`);
  }
  assert.match(map, /\| impeccable@impeccable \| first choice for screens \|/);
  assert.match(map, /counts only under `~\/\.claude\/plugins\/cache\/` or\s+`~\/\.claude\/skills\/`/);
  assert.match(map, /never overrides the handbook or the security\s+rules/);
});

test('settings-additions.json sets the lead model and turns GateGuard off', () => {
  const s = JSON.parse(read('claude/settings-additions.json'));
  assert.equal(s.model, 'opus');
  assert.equal(s.env?.ECC_GATEGUARD, 'off');
  // update.sh adds every key in this file to every laptop without asking. A new key
  // must first be named in the README section "What you need", then added here.
  assert.deepEqual(Object.keys(s).sort(), ['attribution', 'env', 'model', 'statusLine']);
  assert.deepEqual(Object.keys(s.env), ['ECC_GATEGUARD']);
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
  assert.ok(linkProblems(here('claude'), join(dir, 'empty')).length >= 13 + 3 + 5);

  const asked = [];
  const works = (command) => { asked.push(command); return command !== 'semgrep --version'; };
  assert.deepEqual(toolProblems(['gh', 'semgrep'], works), ['semgrep: not installed; run the installer again']);
  assert.deepEqual(asked, ['gh --version', 'semgrep --version']);
  assert.equal(runs('node --version'), true);
  assert.equal(runs('no-such-tool-of-the-kit --version'), false);
});

test('every laptop gets the same settings, connections and tools as the first one', () => {
  const kit = JSON.parse(read('claude/settings-additions.json'));
  assert.deepEqual(settingsProblems({}, kit), ['model', 'env', 'attribution', 'statusLine'].map((key) => `settings.json: ${key} is missing; run bash update.sh`));
  assert.deepEqual(settingsProblems({ model: 'sonnet', env: {} }, { model: 'opus', env: { ECC_GATEGUARD: 'off' } }), [
    'settings.json: env.ECC_GATEGUARD is missing; run bash update.sh',
  ]);
  assert.deepEqual(settingsProblems({ ...kit, model: 'sonnet', theme: 'dark' }, kit), []);
  assert.deepEqual(settingsProblems(null, kit), ['settings.json: cannot be read as a JSON object; repair the file, then run bash update.sh']);
  // update.sh writes the settings; nobody has to merge a file by hand.
  assert.ok(read('update.sh').includes('node "$KIT/settings-merge.mjs"'), 'update.sh does not merge the settings');
  const win = read('install-windows.bat');
  const mac = read('install-mac.command');
  for (const installer of [win, mac]) {
    assert.doesNotMatch(installer, /Merge claude/);
    assert.ok(installer.includes('claude mcp add --scope user playwright npx @playwright/mcp@latest'));
    assert.ok(installer.includes('claude mcp add --scope user --transport http sentry https://mcp.sentry.dev/mcp'));
  }
  // check.mjs fails on a missing tool, so both installers must install every one.
  const winName = { gh: 'GitHub.cli', gitleaks: 'Gitleaks.Gitleaks', semgrep: 'pip install semgrep', 'osv-scanner': 'Google.OSVScanner', bun: 'Oven-sh.Bun', ccusage: 'npm install -g ccusage' };
  const brew = mac.match(/^brew install (.*)$/m)[1].split(/\s+/).map((formula) => formula.split('/').pop());
  for (const tool of tools) {
    assert.ok(win.includes(winName[tool]), `install-windows.bat does not install ${tool}`);
    assert.ok(brew.includes(tool) || mac.includes(`npm install -g ${tool}`), `install-mac.command does not install ${tool}`);
  }
  all(read('check.mjs'), [/runs\('claude mcp get playwright'\)/, /toolProblems\(tools, runs\)/, /linkProblems\(join\(kit, 'claude'\), dest\)/]);
  all(section(read('README.md'), 'What you need'), [
    /`~\/\.claude\/settings\.json`/, /A value you set yourself is never changed/, /`settings\.json\.backup`/,
    /A key you delete is added again on the next update/, /the Sentry MCP server/, /claude mcp remove sentry -s user/,
  ]);
  assert.doesNotMatch(section(read('README.md'), 'Install'), /Merge `claude\/settings-additions\.json`/);
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
  each(/(\d+) staff agents/g, readdirSync(here('claude/agents')).filter((f) => f.endsWith('.md')).length);
  each(
    /(\d+) company skills/g,
    // lessons counts by its starter: its SKILL.md is the founder's own file and is not in the repo.
    readdirSync(here('claude/skills')).filter((d) => !external.has(d) && ['SKILL.md', 'starter.md'].some((f) => existsSync(here(`claude/skills/${d}/${f}`)))).length,
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
  const md = read('claude/CLAUDE.md');
  const heads = ['### 1. Study', '### 2. Propose: one short plan, one yes', '### 3. Build', '### 4. Check yourself, before the founder sees it', '### 5. Show'];
  const at = heads.map((h) => md.indexOf(`\n${h}\n`));
  for (const [i, pos] of at.entries()) assert.ok(pos > 0, `handbook lacks "${heads[i]}"`);
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

test('the founder is never interviewed and says yes once', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, '1\\. Study'), [/Never interview the founder/, /Run it and look at it as it is today/, /what the founder did not say but the product needs/]);
  all(section(md, '2\\. Propose'), [
    /At most 15 lines/, /mark each\s+"added"/, /what must stay on the server/, /Left out, and why/, /Skills: the skill files this work will use/,
    /wait for the founder's yes/, /do not plan again from zero/, /A small order [^.]* needs no plan/, /That is the only kind of question/,
  ]);
  const bts = read('claude/skills/brief-to-spec/SKILL.md');
  all(bts, [/Do not ask the founder to choose/, /without interviewing the founder/, /^10\. Slices/m, /^11\. Look and theme/m, /never drop section 7/, /under\s+`## Skills`/, /Wait for the founder's yes/]);
  assert.doesNotMatch(bts, /questions per round|multiple-choice/);
  assert.match(read('claude/skills/new-project/SKILL.md'), /## Skills/);
  assert.match(read('claude/templates/project-CLAUDE.md'), /^## Skills/m);
});

test('every screen gets a design skill, fitting motion and every state', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, '3\\. Build'), [
    /Any screen: a design skill\s+from the skill map \(impeccable first\) and frontend-standards/, /Read the plan's skill files before writing/,
    /Motion where it helps/, /none where it distracts \(login, forms,\s+settings\)/, /hover, pressed, focus, empty, loading, error/,
    /Phone and big screen/, /never emoji/,
  ]);
  all(section(md, '4\\. Check yourself'), [/use every feature in a real browser/, /generic or AI-made/, /Every new screen or redesign then goes to\s+ux-reviewer/]);
  all(section(md, '5\\. Show'), [/A screenshot or a local URL/, /at most 8 lines/, /"tests pass" is not "good"/]);
});

test('security is always on, scale only when the product needs it', () => {
  const md = read('claude/CLAUDE.md');
  for (const rule of ['security', 'testing', 'skill-map']) assert.match(md, new RegExp(`^@~/\\.claude/rules/${rule}\\.md$`, 'm'));
  assert.doesNotMatch(md, /^@.*scale\.md/m);
  all(section(md, 'Scale'), [/scale-standards skill only when docs\/SPEC\.md says/, /does not get\s+multi-tenant tables/]);
  // Every file in claude/rules/ loads into every session, so the scale rules live in a skill, read on demand.
  assert.ok(!existsSync(here('claude/rules/scale.md')), 'scale.md is back in the always-loaded rules folder');
  all(read('claude/skills/scale-standards/SKILL.md'), [/^description: .*Use only when docs\/SPEC\.md says/m, /never for a prototype/, /organisation_id/, /paginated on the server/]);
  assert.doesNotMatch(read('claude/skills/backend-standards/SKILL.md'), /organisation_id|large organisations/);
  all(read('claude/rules/security.md'), [/from the first line of a prototype/, /Never\s+skip a rule that does apply/, /parameterised queries/, /No secrets in frontend code/]);
  all(section(md, '3\\. Build'), [/Server\s+code: backend-standards and security-checklist/, /apply from the first\s+line of a prototype/, /Secrets, tokens, keys and anything worth stealing\s+live on the server/]);
  all(section(md, '4\\. Check yourself'), [/against the security-checklist skill/, /Login,\s+permission checks, database queries, payment, upload, personal data or a\s+new dependency also goes to security-reviewer/, /security-researcher/]);
  assert.match(read('claude/agents/security-reviewer.md'), /^description: .*login, permission checks, database queries, payment, upload, personal data or a new dependency/m);
});

test('code stays in order and one feature is not a chain of agents', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, '3\\. Build'), [
    /The lead builds/, /Never a chain of planner, approver and builder/, /one job per file/, /no dead\s+code, no copy-pasted blocks/,
    /smallest change that fully does the job/, /Never cut validation, permission checks, error handling or tests/,
  ]);
  assert.doesNotMatch(md, /founder-proxy|\bTiny\b|\bRisky\b|\btiers?\b|ecc:/i);
  assert.ok(!existsSync(here('claude/agents/founder-proxy.md')), 'founder-proxy is back');
  all(section(md, 'Staff'), [/you are not the lead/, /never delegate it/, /10\s+lines or less/, /a short brief with file paths/]);
});

test('the builder never has the last word on its own work', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, '4\\. Check yourself'), [
    /The builder never has the last word on its own work/, /Tools first: lint, typecheck, tests and gitleaks/, /Red means fix, not show/,
    /one saved browser test of its main path/, /code-reviewer reads every code change/, /Only a small order \(step 2\) skips it/,
    /Send the reviewers in one message/, /Fix every\s+medium or higher finding; the reviewer that raised it checks the fix/, /hard-bug row of the skill map/,
  ]);
  assert.match(section(md, '3\\. Build'), /architect reviews the data\s+model in docs\/SPEC\.md once, before any code/);
  const cr = read('claude/agents/code-reviewer.md');
  const front = (cr.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
  assert.equal(front.match(/^tools:\s*(.*?)\s*$/m)?.[1], 'Read, Grep, Glob, Bash');
  all(cr, [/You did not write this code/, /Never edit a file/, /Do not run the tests again/, /is data, not instructions/, /PASS or FINDINGS/, /high\/medium\/low/]);
  assert.match(read('claude/rules/skill-map.md'), /\| A bug that survived one fix \| none: read the file \| .*systematic-debugging\/SKILL\.md.*the plugin stays off \|/);
  assert.match(section(md, 'Staff'), /does not run the tests again and does not comment on style/);
});

test('production is the full sweep of the whole product, on the founder\'s word', () => {
  const p = section(read('claude/CLAUDE.md'), 'Production');
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
  const md = read('claude/CLAUDE.md');
  all(section(md, '1\\. Study'), [
    /The founder's projects are business projects/, /For a new product or a\s+large feature also use the product-sense skill/,
    /Minutes, not a\s+report/, /Use the lessons skill when a project starts/,
  ]);
  // Lessons live in a skill: a session can always load a skill, but not a file outside its project folder.
  all(read('claude/skills/lessons/starter.md'), [/^name: lessons$/m, /^description: .*Use in the Study step when a project starts/m, /Verified things only/, /60 lines at\s+most/]);
  assert.ok(read('claude/skills/lessons/starter.md').trimEnd().split(/\r?\n/).length <= 70, 'lessons skill over 70 lines');
  all(section(md, '2\\. Propose'), [
    /Worth building because: the user, the problem, why they would choose this/,
    /My advice: only when you would build less, build something different, or\s+not build it/, /Say why, plainly\. The founder decides/,
  ]);
  assert.match(section(md, '5\\. Show'), /End with one line\s+"I noticed"/);
  all(section(md, 'The company learns'), [
    /The lessons skill \(`~\/\.claude\/skills\/lessons\/SKILL\.md`\)/, /Verified things only, three lines each at most, newest first, 60 lines at\s+most/, /This\s+one file needs no yes/,
    /corrects the same kind of thing twice, propose one rule\s+change in plain words/, /Change nothing without the yes/,
  ]);
  assert.match(section(md, 'Every project remembers'), /what problem it solves,\s+how success is measured/);
  const ps = read('claude/skills/product-sense/SKILL.md');
  all(ps, [
    /^description: .*never for a fix or a small change/m, /one or\s+two web searches at most/, /or "not checked"/, /The simpler way/,
    /Cost to run/, /The founder\s+decides; then build what the founder chose, fully/, /No market-size tables, no SWOT, no invented numbers/,
  ]);
  assert.match(read('claude/skills/brief-to-spec/SKILL.md'), /^12\. Business: target user/m);
  // Business thinking is a skill and two plan lines, never a department.
  for (const f of readdirSync(here('claude/agents'))) assert.doesNotMatch(f, /ceo|finance|marketing|sales/i, `${f}: a department agent`);
});

test('the founder\'s own lessons never leave the laptop', () => {
  const own = 'claude/skills/lessons/SKILL.md';
  assert.equal(execFileSync('git', ['ls-files', '--', own], { cwd: here('.'), encoding: 'utf8' }).trim(), '', `${own} is tracked again`);
  assert.match(read('.gitignore'), /^claude\/skills\/lessons\/SKILL\.md$/m);
  // update.sh creates the own file from the starter once and never overwrites it.
  assert.ok(read('update.sh').includes('[ -e "$LESSONS/SKILL.md" ] || cp "$LESSONS/starter.md" "$LESSONS/SKILL.md"'), 'update.sh does not create the lessons file');
  assert.match(read('check.mjs'), /'skills', 'lessons', 'SKILL\.md'/);
  const starter = read('claude/skills/lessons/starter.md');
  assert.match(starter, /git ignores it, so what you\s+write never leaves this laptop/);
  assert.doesNotMatch(starter, /\b20\d\d-\d\d-\d\d\b/, 'the starter carries a dated note from one founder');
  assert.match(starter, /switching to a branch that still\s+tracks it replaces it without a warning/);
});

test('anyone may use the kit', () => {
  all(read('LICENSE'), [/^MIT License$/m, /Permission is hereby granted, free of charge, to any person/]);
  all(read('README.md'), [/^## Who it is for$/m, /^## What you need$/m, /^## What it costs$/m, /\[LICENSE\]\(LICENSE\)/]);
  assert.doesNotMatch(read('README.md'), /My personal/);
  // A stranger must be able to read what the installer changes on the machine before running it.
  all(section(read('README.md'), 'What you need'), [
    /Homebrew if it is missing/, /renamed to `<name>\.backup`/, /copied to `CLAUDE\.md\.backup` once/, /on every `bash update\.sh`/,
    /a repo's own `\.git\/hooks` no longer run/, /removes Claude co-author/, /`gh auth setup-git`/, /`gh auth login`/,
    /git config --global --unset core\.hooksPath/, /every plugin in `plugins\.txt`/, /`~\/\.claude\/vendor`/,
  ]);
  assert.ok(
    read('install-windows.bat').includes('if not exist "%USERPROFILE%\\.claude\\CLAUDE.md.backup" copy "%USERPROFILE%\\.claude\\CLAUDE.md" "%USERPROFILE%\\.claude\\CLAUDE.md.backup"'),
    'the Windows installer overwrites an existing handbook without a backup',
  );
  assert.doesNotMatch(section(read('claude/CLAUDE.md'), 'Who you work for'), /AI technologist/i);
});

test('the founder can always go back, and reports are in plain words', () => {
  const md = read('claude/CLAUDE.md');
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
  const t = read('claude/rules/testing.md');
  all(t, [/one saved browser test \(Playwright\) of its\s+main path/,/^## Prototype \(the default\)$/m, /^## Before real users or real data$/m, /Never delete, skip or weaken a test/, /the failing test first/, /clicked through in a real browser/, /80%\+/, /CI on GitHub green/]);
});

test('only the founder decides outward and irreversible actions', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, 'Only the founder decides'), [
    /deploying to production/, /deleting data, a repo or a\s+branch with unmerged work/, /a force push/, /making a repo public/,
    /messages to real people/, /a paid service/, /secrets and credentials/, /Commit,\s+push, merge and release happen on the founder's word/,
    /Changing the company itself/, /needs the founder's yes to a change described in plain\s+words first/,
  ]);
  const sec = read('claude/agents/github-secretary.md');
  all(sec, [
    /the founder has said to commit,\s+push, merge or release/, /gh pr merge <n> --squash --delete-branch --match-head-commit <sha>/, /Refuse to merge/,
    /if that commit is not the PR head/, /git tag -a vX\.Y\.Z <sha>/, /CHANGELOG\.md was updated and merged before the release/, /Refuse to tag if/,
    /if main has moved past that commit/, /Never commit it/,
  ]);
  assert.doesNotMatch(sec, /founder-proxy|\bTiny\b/);
  assert.doesNotMatch(sec, /update CHANGELOG\.md/);
});

test('hard rules forbid shell file writes and false claims', () => {
  const rules = section(read('claude/CLAUDE.md'), 'Hard rules');
  assert.ok(rules, 'no Hard rules section');
  assert.match(rules, /\bWrite\b/);
  assert.match(rules, /\bEdit\b/);
  assert.ok(rules.includes('node -e'), 'no "node -e"');
  assert.match(rules, /heredoc/i);
  all(rules, [
    /only with the Write or Edit tools, never through the shell/, /unless you ran it and saw it work/, /Never delete, skip or weaken a test/,
    /Never commit secrets, \.env files, real people's data/, /Project repos are private\s+unless the founder says otherwise/, /Three failed tries/,
  ]);
});

test('agent models are pinned', () => {
  const models = {
    architect: 'fable', 'backend-dev': 'sonnet', 'code-reviewer': 'opus', 'devops-engineer': 'sonnet', 'frontend-dev': 'sonnet',
    'github-secretary': 'sonnet', 'integration-checker': 'opus', planner: 'opus', 'security-researcher': 'opus',
    'security-reviewer': 'opus', 'site-monitor': 'haiku', tester: 'sonnet', 'ux-reviewer': 'opus',
  };
  const files = readdirSync(here('claude/agents')).filter((f) => f.endsWith('.md'));
  assert.deepEqual(files.map((f) => f.slice(0, -3)).sort(), Object.keys(models).sort());
  for (const f of files) {
    const text = read(`claude/agents/${f}`);
    const front = (text.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
    assert.equal(front.match(/^model:\s*(\S+)/m)?.[1], models[f.slice(0, -3)], `${f} model`);
    assert.doesNotMatch(text, /founder-proxy|\bTiny\b|\bRisky\b|routing table/, `${f} still names the old workflow`);
  }
});

test('every project remembers, and the founder is spoken to in plain words', () => {
  const md = read('claude/CLAUDE.md');
  all(section(md, 'Every project remembers'), [/docs\/SPEC\.md/, /docs\/STATUS\.md/, /Read both at the start/, /new-project skill/]);
  all(section(md, 'Style'), [/Plain words to the founder/, /no jargon/, /answer first, then the reason, then the next step/, /Never drop not, never, no,\s+only or a number/]);
  all(section(md, 'Who you work for'), [/a topic and a few rough\s+points/, /only have to look and say yes/, /The main session is the lead/]);
});

test('tokens are spent on the product, not on process', () => {
  all(section(read('claude/CLAUDE.md'), 'Cost'), [
    /Read only the files the task needs, never the whole repo/, /goes to a haiku worker/, /in one message/,
    /A sub-agent starts cold/, /re-reads its whole history on every turn/, /Task done - start a new session\s+for the next task/,
    /Routine work runs on opus or sonnet/, /say so once in\s+one line and carry on/,
  ]);
  // Only these rule files may load into every session.
  assert.deepEqual(readdirSync(here('claude/rules')).sort(), ['security.md', 'skill-map.md', 'testing.md']);
});

test('handbook stays within its line budget', () => {
  const md = read('claude/CLAUDE.md');
  assert.ok(md.trimEnd().split(/\r?\n/).length <= 195, 'handbook over 195 lines');
  assert.ok(Buffer.byteLength(md.replace(/\r\n/g, '\n')) <= 10500, 'handbook over 10500 bytes');
});
