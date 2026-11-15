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
