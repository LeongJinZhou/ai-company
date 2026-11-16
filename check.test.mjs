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
    architect: 'fable', 'backend-dev': 'sonnet', 'devops-engineer': 'sonnet', 'frontend-dev': 'sonnet',
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
});
