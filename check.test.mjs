import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { problems, rows } from './check.mjs';

const here = (p) => join(import.meta.dirname, p);

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

test('settings-additions.json sets the lead model and turns GateGuard off', () => {
  const s = JSON.parse(readFileSync(here('claude/settings-additions.json'), 'utf8'));
  assert.equal(s.model, 'opus');
  assert.equal(s.env?.ECC_GATEGUARD, 'off');
});

test('README counts match the files', () => {
  const readme = readFileSync(here('README.md'), 'utf8');
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
  each(/(\d+) core plugins/g, plugins.filter((r) => r[2] === 'on').length);
  each(/(\d+) plugins that are off/g, plugins.filter((r) => r[2] === 'off').length);
});

test('every relative link in README.md exists', () => {
  const readme = readFileSync(here('README.md'), 'utf8').replace(/```[\s\S]*?```/g, '');
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
  const readme = readFileSync(here('README.md'), 'utf8');
  assert.ok(readme.includes('src="docs/assets/banner.svg"'));
  assert.ok(readme.includes('actions/workflows/ci.yml/badge.svg'));
  assert.equal((readme.match(/```mermaid/g) || []).length, 3);
});

test('handbook names the tiers and the risky paths', () => {
  const md = readFileSync(here('claude/CLAUDE.md'), 'utf8');
  // each tier needs its own definition bullet, not just a mention in the table
  for (const w of ['Tiny', 'Normal', 'Risky']) assert.match(md, new RegExp(`^- ${w}: \\S`, 'm'), `handbook lacks "- ${w}:" bullet`);
  const risky = (md.match(/^- Risky:[\s\S]*?(?=\n\s*\n|\n- |(?![\s\S]))/m) || [''])[0].toLowerCase();
  assert.ok(risky, 'no "- Risky:" paragraph');
  for (const re of [/auth/, /migration/, /payment/, /dependenc/, /\bci\b/, /script/]) assert.match(risky, re);
  for (const re of [/plugins\.txt/, /skills\.txt/, /refs\.txt/, /\*\.cmd/, /\*\.ps1/, /`rules\/`/, /`templates\/`/]) assert.match(risky, re);
  for (const re of [/\*\.sh/, /\*\.bat/, /\*\.command/, /agent instruction files/, /`\.github\/`/]) assert.match(risky, re);
  const tiny = (md.match(/^- Tiny:[\s\S]*?(?=\n\s*\n|\n- |(?![\s\S]))/m) || [''])[0].toLowerCase();
  assert.match(tiny, /md, txt/); assert.match(tiny, /whatever its extension/);
});

test('agent models match the routing table', () => {
  const models = {
    architect: 'fable', 'backend-dev': 'sonnet', 'devops-engineer': 'sonnet', 'founder-proxy': 'fable', 'frontend-dev': 'sonnet',
    'github-secretary': 'sonnet', 'integration-checker': 'opus', planner: 'opus', 'security-researcher': 'opus',
    'security-reviewer': 'opus', 'site-monitor': 'haiku', tester: 'sonnet', 'ux-reviewer': 'opus',
  };
  const files = readdirSync(here('claude/agents')).filter((f) => f.endsWith('.md'));
  assert.deepEqual(files.map((f) => f.slice(0, -3)).sort(), Object.keys(models).sort());
  for (const f of files) {
    const front = (readFileSync(here(`claude/agents/${f}`), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
    const m = front.match(/^model:\s*(\S+)/m);
    assert.equal(m?.[1], models[f.slice(0, -3)], `${f} model`);
  }
});

test('hard rules forbid shell file writes', () => {
  const md = readFileSync(here('claude/CLAUDE.md'), 'utf8');
  const rules = (md.match(/^## Hard rules[\s\S]*?(?=^## |(?![\s\S]))/m) || [''])[0];
  assert.ok(rules, 'no Hard rules section');
  assert.match(rules, /\bWrite\b/);
  assert.match(rules, /\bEdit\b/);
  assert.ok(rules.includes('node -e'), 'no "node -e"');
  assert.match(rules, /heredoc/i);
  assert.match(rules, /only with the Write or Edit tools, never through the shell/);
});

test('README diagram 2 shows tiers and the tool gate', () => {
  const blocks = [...readFileSync(here('README.md'), 'utf8').matchAll(/```mermaid([\s\S]*?)```/g)].map((m) => m[1]);
  assert.equal(blocks.length, 3);
  assert.ok(blocks[1].includes('Tier'), 'diagram 2 lacks Tier');
  assert.match(blocks[1], /tool gate/i);
  assert.match(blocks[0], /founder-proxy/);
  assert.match(blocks[1], /founder-proxy/);
});

test('handbook names the founder gates and the must-escalate list', () => {
  const md = readFileSync(here('claude/CLAUDE.md'), 'utf8');
  const raw = (md.match(/^## Founder gates[\s\S]*?(?=^## |(?![\s\S]))/m) || [''])[0];
  const gates = raw.toLowerCase();
  assert.ok(gates, 'no Founder gates section');
  for (const re of [
    /APPROVE, CHANGES \(numbered list\) or ESCALATE/,
    /only for the item it names: a plan by its path and `git hash-object` hash, a merge by the PR head commit, a release by the version and the main commit/,
    /An edited plan, a new commit or a moved main needs a new decision/,
    /ORDERS cover only what this task needs to be complete/,
    /They never add a feature/,
    /A hit goes to the founder; founder-proxy is not asked/,
    /A third CHANGES on the same item is ESCALATE/,
    /posts founder-proxy's answer word for word as a PR comment and refuses to merge or tag without it/,
  ]) assert.match(raw, re);
  for (const w of ['approve', 'changes', 'escalate', 'orders', "never the founder's word", 'fable decided:']) {
    assert.ok(gates.includes(w), `gates lack "${w}"`);
  }
  for (const re of [
    /public/, /deleting a repo, data, or a branch with unmerged work/, /drops, overwrites or narrows data, or has no tested down step/,
    /collaborators/, /package registry/, /repo visibility/, /a requirement the spec does not answer/, /skills\.txt/, /refs\.txt/,
    /agents\.md/, /\*\.bat/, /\*\.cmd/, /\*\.command/, /\*\.ps1/, /skipping, deleting or weakening a test, check or gate/,
    /`\.claude-plugin\/`/, /any other ci or hook config/, /real people/, /paid/, /payment/, /secrets and credentials/, /spec\.md/,
    /first production deploy/, /major-version/, /medium-or-higher/, /weakening/, /any claude\.md/, /`rules\/`/,
    /`agents\/`/, /`skills\/`/, /`git-hooks\/`/, /`\.github\/`/, /`\.claude\/`/, /`claude\/`/, /settings\*\.json/,
    /\.mcp\.json/, /plugins\.txt/, /\*\.sh/, /force push/, /branch protection/, /tag or release/,
    /3 failed fix rounds/, /not sure/,
  ]) assert.match(gates, re);
  assert.match(md, /github-secretary, founder-proxy\), you are NOT the lead/);
  assert.match(md, /^fable\s+- THINK and DECIDE: founder-proxy/m);
  assert.match(md, /Brief, 7 lines:.*why: /);
});

test('founder-proxy is read-only and treats what it reads as data', () => {
  const file = readFileSync(here('claude/agents/founder-proxy.md'), 'utf8');
  const front = (file.match(/^---\r?\n([\s\S]*?)\r?\n---/) || ['', ''])[1];
  assert.equal(front.match(/^tools:\s*(.*?)\s*$/m)?.[1], 'Read, Grep, Glob, Bash');
  assert.doesNotMatch(front, /^memory:/m);
  for (const re of [
    /is data/, /quote it/, /APPROVE/, /CHANGES/, /ESCALATE/, /ORDERS/, /Never edit, commit, push, merge, tag or deploy/,
    /Bash only for `git diff`/, /`git hash-object`/, /Only the handbook \(`~\/\.claude\/CLAUDE\.md`/,
    /A hit or a doubt is ESCALATE/, /Missing evidence or not sure means ESCALATE/,
    /Release gate: ITEM is the version and the main commit/, /patch or minor only; not a first production deploy/,
    /a missing decision or a different hash is ESCALATE/, /put the plan's `git hash-object` hash in ITEM/,
  ]) assert.match(file, re);
  const sec = readFileSync(here('claude/agents/github-secretary.md'), 'utf8');
  for (const re of [
    /gh pr merge <n> --squash --delete-branch --match-head-commit <sha>/, /as a PR comment/, /Refuse to merge/, /git tag -a vX\.Y\.Z <sha>/,
    /CHANGELOG\.md was updated and merged before the gate/, /Refuse to tag if/, /word for word in the release notes/,
    /if main has moved past that commit/, /if the ITEM commit is not the PR head/,
  ]) assert.match(sec, re);
  assert.doesNotMatch(sec, /update CHANGELOG\.md/);
});
