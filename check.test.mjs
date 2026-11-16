import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { problems, rows } from './check.mjs';

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
    readdirSync(here('claude/skills')).filter((d) => existsSync(here(`claude/skills/${d}/SKILL.md`)) && !external.has(d)).length,
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
  all(blocks[1], [/1\. Study/, /2\. Propose/, /Founder says yes\?/, /3\. Build/, /4\. Check itself/, /5\. Show/, /only on the founder's word/]);
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
  all(section(md, '4\\. Check yourself'), [/use every feature in a real browser/, /generic or AI-made/, /ux-reviewer/, /Read your own diff as a reviewer/, /Tests and lint pass/]);
  all(section(md, '5\\. Show'), [/A screenshot or a local URL/, /at most 8 lines/, /"tests pass" is not "good"/]);
});

test('security is always on, scale only when the product needs it', () => {
  const md = read('claude/CLAUDE.md');
  for (const rule of ['security', 'testing', 'skill-map']) assert.match(md, new RegExp(`^@~/\\.claude/rules/${rule}\\.md$`, 'm'));
  assert.doesNotMatch(md, /^@.*scale\.md/m);
  all(section(md, 'Scale'), [/apply it only when docs\/SPEC\.md says/, /does not get multi-tenant tables/]);
  assert.match(read('claude/rules/scale.md'), /Apply these only when docs\/SPEC\.md says/);
  all(read('claude/rules/security.md'), [/from the first line of a prototype/, /Never\s+skip a rule that does apply/, /parameterised queries/, /No secrets in frontend code/]);
  all(section(md, '3\\. Build'), [/Server\s+code: backend-standards and security-checklist/, /apply from the first\s+line of a prototype/, /Secrets, tokens, keys and anything worth stealing\s+live on the server/]);
  all(section(md, '4\\. Check yourself'), [/against the security-checklist skill/, /Login,\s+payment, upload, personal data or a new dependency also goes to\s+security-reviewer/, /security-researcher/]);
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

test('testing grows with the product', () => {
  const t = read('claude/rules/testing.md');
  all(t, [/^## Prototype \(the default\)$/m, /^## Before real users or real data$/m, /Never delete, skip or weaken a test/, /the failing test first/, /clicked through in a real browser/, /80%\+/, /CI on GitHub green/]);
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
    /Never commit secrets, \.env files, real people's data/, /Repos are private/, /Three failed tries/,
  ]);
});

test('agent models are pinned', () => {
  const models = {
    architect: 'fable', 'backend-dev': 'sonnet', 'devops-engineer': 'sonnet', 'frontend-dev': 'sonnet',
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

test('handbook stays within its line budget', () => {
  const md = read('claude/CLAUDE.md');
  assert.ok(md.trimEnd().split(/\r?\n/).length <= 125, 'handbook over 125 lines');
  assert.ok(Buffer.byteLength(md.replace(/\r\n/g, '\n')) <= 6500, 'handbook over 6500 bytes');
});
