// Adds the kit's settings (antigravity/settings-additions.json) to the Antigravity CLI's
// settings file, ~/.gemini/antigravity-cli/settings.json.
// Only missing keys are added: a value you set yourself is never changed.
// The file as it was before the first change is kept as settings.json.backup,
// unless a file of that name is already there.
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kit = dirname(fileURLToPath(import.meta.url));
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// The keys of `additions` that `current` lacks, as dotted paths ("env.ECC_GATEGUARD").
export function missing(current, additions, prefix = '') {
  const out = [];
  for (const [key, value] of Object.entries(additions)) {
    if (!Object.hasOwn(current, key)) out.push(prefix + key);
    else if (isObject(value) && isObject(current[key])) out.push(...missing(current[key], value, `${prefix}${key}.`));
  }
  return out;
}

// `current` plus every key of `additions` it lacks. Neither input is changed.
export function merge(current, additions) {
  const out = { ...current };
  for (const [key, value] of Object.entries(additions)) {
    if (!Object.hasOwn(out, key)) out[key] = structuredClone(value);
    else if (isObject(value) && isObject(out[key])) out[key] = merge(out[key], value);
  }
  return out;
}

export const additions = () => JSON.parse(readFileSync(join(kit, 'antigravity', 'settings-additions.json'), 'utf8'));

// This machine's settings file. AI_COMPANY_SETTINGS_DIR names another folder; the tests use it.
export const settingsFile = () => join(process.env.AI_COMPANY_SETTINGS_DIR || join(homedir(), '.gemini', 'antigravity-cli'), 'settings.json');

// The settings of this machine: {} when there is no file yet, null when the file cannot be read as a JSON object.
export function readSettings(file) {
  if (!existsSync(file)) return {};
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = settingsFile();
  const current = readSettings(file);
  if (current === null) {
    console.error(`settings: ${file} could not be read as a JSON object; nothing was changed. Repair the file, then run bash update.sh.`);
    process.exit(1);
  }
  const wanted = additions();
  const added = missing(current, wanted);
  if (added.length) {
    // A settings file that is a link (a dotfiles setup) stays a link: the real file is written.
    const target = existsSync(file) ? realpathSync(file) : file;
    const tmp = `${target}.tmp`;
    try {
      // A laptop where the CLI never saved a setting has no settings folder yet.
      mkdirSync(dirname(target), { recursive: true });
      if (existsSync(file) && !existsSync(`${file}.backup`)) copyFileSync(file, `${file}.backup`);
      // Written beside the file and renamed, so a stopped run never leaves half a settings file.
      // The file keeps its permissions; a new one is for its owner only, as settings can hold tokens.
      const mode = existsSync(target) ? statSync(target).mode & 0o777 : 0o600;
      rmSync(tmp, { force: true });
      writeFileSync(tmp, JSON.stringify(merge(current, wanted), null, 2) + '\n', { mode });
      renameSync(tmp, target);
    } catch (error) {
      rmSync(tmp, { force: true });
      console.error(`settings: ${file} could not be written (${error.code || error.message}); nothing was changed. Close other Antigravity sessions, then run bash update.sh.`);
      process.exit(1);
    }
    console.log(`settings: added ${added.join(', ')}`);
  }
}
