import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { additions, merge, missing, readSettings } from './settings-merge.mjs';

const kitSettings = { model: 'opus', env: { ECC_GATEGUARD: 'off' }, attribution: { commit: '', pr: '', sessionUrl: false } };

test('missing keys are added, at the top and inside a section', () => {
  const current = { theme: 'dark', env: { MY_VAR: '1' } };
  assert.deepEqual(missing(current, kitSettings), ['model', 'env.ECC_GATEGUARD', 'attribution']);
  assert.deepEqual(merge(current, kitSettings), {
    theme: 'dark',
    env: { MY_VAR: '1', ECC_GATEGUARD: 'off' },
    model: 'opus',
    attribution: { commit: '', pr: '', sessionUrl: false },
  });
});

test('a value the user set is never changed', () => {
  const current = { model: 'sonnet', env: { ECC_GATEGUARD: 'on' }, attribution: { commit: 'mine', pr: '', sessionUrl: true } };
  assert.deepEqual(missing(current, kitSettings), []);
  assert.deepEqual(merge(current, kitSettings), current);
});

test('a falsy or empty value the user set still counts as set', () => {
  const current = { model: '', env: {}, attribution: { commit: null, pr: 0, sessionUrl: false } };
  assert.deepEqual(missing(current, kitSettings), ['env.ECC_GATEGUARD']);
  assert.deepEqual(merge(current, kitSettings), { ...current, env: { ECC_GATEGUARD: 'off' } });
});

test('a section the user wrote as another type is left alone', () => {
  const current = { model: 'opus', env: 'none', attribution: ['x'] };
  assert.deepEqual(missing(current, kitSettings), []);
  assert.deepEqual(merge(current, kitSettings), current);
});

test('merging changes neither input, and a second merge adds nothing', () => {
  const current = { env: { MY_VAR: '1' } };
  const before = JSON.stringify([current, kitSettings]);
  const merged = merge(current, kitSettings);
  assert.equal(JSON.stringify([current, kitSettings]), before);
  merged.attribution.commit = 'changed';
  assert.equal(kitSettings.attribution.commit, '', 'the merged copy shares a section with the kit settings');
  assert.deepEqual(missing(merge(current, kitSettings), kitSettings), []);
});

// Runs the real script against a throwaway settings folder.
function run(settingsText) {
  const dir = mkdtempSync(join(tmpdir(), 'kit-settings-'));
  const file = join(dir, 'settings.json');
  if (settingsText !== undefined) writeFileSync(file, settingsText);
  const once = () => spawnSync(process.execPath, [join(import.meta.dirname, 'settings-merge.mjs')], { env: { ...process.env, CLAUDE_CONFIG_DIR: dir }, encoding: 'utf8' });
  return { dir, file, once, text: () => readFileSync(file, 'utf8') };
}

test('a machine with no settings file gets the kit settings, and no backup', (t) => {
  const m = run();
  t.after(() => rmSync(m.dir, { recursive: true }));
  const result = m.once();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(m.text()), additions());
  assert.ok(!existsSync(`${m.file}.backup`));
  assert.ok(!existsSync(`${m.file}.tmp`));
  // Settings can hold tokens: a new file is for its owner only. Windows has no such file mode.
  if (process.platform !== 'win32') assert.equal(statSync(m.file).mode & 0o777, 0o600);
});

test('a settings file that is a link stays a link and keeps its permissions', { skip: process.platform === 'win32' && 'Windows needs admin rights to make a link' }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-settings-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const real = join(dir, 'dotfiles-settings.json');
  const config = join(dir, 'config');
  const link = join(config, 'settings.json');
  mkdirSync(config);
  writeFileSync(real, '{ "model": "sonnet" }', { mode: 0o640 });
  chmodSync(real, 0o640);
  symlinkSync(real, link);
  const result = spawnSync(process.execPath, [join(import.meta.dirname, 'settings-merge.mjs')], { env: { ...process.env, CLAUDE_CONFIG_DIR: config }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(lstatSync(link).isSymbolicLink(), 'the link was replaced by a plain file');
  const merged = JSON.parse(readFileSync(real, 'utf8'));
  assert.equal(merged.model, 'sonnet');
  assert.deepEqual(missing(merged, additions()), []);
  assert.equal(statSync(real).mode & 0o777, 0o640);
  assert.equal(readFileSync(`${link}.backup`, 'utf8'), '{ "model": "sonnet" }');
  assert.ok(!existsSync(`${real}.tmp`));
});

test('existing settings keep their values, get one backup, and a second run changes nothing', (t) => {
  const original = '﻿{ "model": "sonnet", "theme": "dark", "env": { "MY_VAR": "1" } }';
  const m = run(original);
  t.after(() => rmSync(m.dir, { recursive: true }));
  const first = m.once();
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /settings: added env\.ECC_GATEGUARD, attribution, statusLine/);
  const merged = JSON.parse(m.text());
  assert.equal(merged.model, 'sonnet');
  assert.equal(merged.theme, 'dark');
  assert.deepEqual(merged.env, { MY_VAR: '1', ECC_GATEGUARD: 'off' });
  assert.deepEqual(missing(merged, additions()), []);
  assert.equal(readFileSync(`${m.file}.backup`, 'utf8'), original);

  const afterFirst = m.text();
  const second = m.once();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, '');
  assert.equal(m.text(), afterFirst);
  assert.equal(readFileSync(`${m.file}.backup`, 'utf8'), original, 'the backup was replaced');
});

test('a settings file that is not a JSON object is refused and left as it is', (t) => {
  for (const broken of ['{ "model": "opus", ', '[1, 2]', '"text"']) {
    const m = run(broken);
    t.after(() => rmSync(m.dir, { recursive: true }));
    const result = m.once();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /could not be read as a JSON object; nothing was changed/);
    assert.equal(m.text(), broken);
    assert.ok(!existsSync(`${m.file}.backup`));
    assert.equal(readSettings(m.file), null);
  }
});
