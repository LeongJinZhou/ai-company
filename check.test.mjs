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
  assert.match(blocks[1], /Tiny/);
  assert.match(blocks[1], /Skills line/);
  assert.match(blocks[1], /\(Tiny: the lead's must-escalate check\)/);
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

const read = (p) => readFileSync(here(p), 'utf8');

test('Tiny has no planner and no founder-proxy call', () => {
  const md = read('claude/CLAUDE.md');
  const tiny = (md.match(/^\| Tiny \|.*$/m) || [''])[0];
  assert.match(md, /^\| Tiny \| the lead, 5 lines or less/m);
  assert.match(md, /Tiny tasks: founder-proxy is not called/);
  assert.match(md, /Tiny: must-escalate checked, no hit; reviewer PASS; tool gate exit 0/);
  assert.doesNotMatch(md, /\| Tiny \| `ecc:planner`/);
  assert.doesNotMatch(md, /plans Tiny tasks/);
  assert.match(tiny, /`ecc:code-reviewer` on opus/);
  const sec = read('claude/agents/github-secretary.md');
  for (const re of [/Tiny \(no founder-proxy answer\)/, /otherwise refuse and report/, /SPEC\.md/, /never `\.svg`/]) assert.match(sec, re);
  assert.match(sec, /nor a Tiny line that passes the check below/);
  const tinyLine = (sec.match(/^.*Tiny \(no founder-proxy answer\).*$/m) || [''])[0];
  assert.ok(tinyLine, 'no Tiny paragraph in github-secretary.md');
  for (const re of [
    /gh api repos\/\{owner\}\/\{repo\}\/pulls\/<n>\/files/, /gh pr checks <n>/, /every status is `added` or `modified`/, /never removed, renamed or copied/, /ignoring case/,
    /`\.md`/, /`\.txt`/, /`\.png`/, /`\.jpg`/, /`\.gif`/, /`\.webp`/, /never `\.svg`/,
    /CLAUDE\.md/, /CLAUDE\.local\.md/, /AGENTS\.md/, /GEMINI\.md/, /SKILL\.md/, /SPEC\.md/,
    /`plugins\.txt`/, /`skills\.txt`/, /`refs\.txt`/, /any file a script, hook or installer reads/,
    /pulls\/<n>\/files --paginate/, /merge only if every check passes/, /Post the lead's line and the reviewer verdict word for word as the PR comment/,
  ]) assert.match(tinyLine, re);
  for (const s of ['rules/', 'agents/', 'skills/', 'templates/', 'git-hooks/', '.claude/', '.claude-plugin/', '.github/', '.husky/', 'claude/']) assert.ok(tinyLine.includes('`' + s + '`'), s);
  assert.match(md, /A hit goes to the founder; a tier-up or a doubt goes back to the full gates/);
  assert.match(md, /the head commit, the reviewer verdict and the line/);
  assert.match(md, /git diff --name-status --no-renames main/);
  assert.doesNotMatch(md, /--name-only main/);
});

test('Normal and Risky keep every security and test check', () => {
  const md = read('claude/CLAUDE.md');
  const normal = (md.match(/^\| Normal \|.*$/m) || [''])[0];
  const risky = (md.match(/^\| Risky \|.*$/m) || [''])[0];
  assert.match(normal, /security-reviewer on sonnet; tester on sonnet/);
  assert.match(risky, /the Normal crew, every check on opus/);
  assert.match(normal, /a finding from security-reviewer or tester: that checker/);
  assert.match(normal, /no worker run/);
  assert.match(normal, /a fix diff that touches a risky path also goes to security-reviewer/);
  assert.match(risky, /security-researcher if the task adds a dependency, login, upload or payment/);
  assert.match(risky, /the same checker, on opus/);
  assert.match(md, /A slice of a plan that passed Gate 1 is not planned or gated again while the plan's hash is unchanged/);
  assert.match(md, /Run security-researcher again/);
});

test('skills are proposed, seen, checked and proven', () => {
  const md = read('claude/CLAUDE.md');
  const skills = (md.match(/^## Skills are used[\s\S]*?(?=^## )/m) || [''])[0];
  assert.ok(skills, 'no Skills section');
  for (const re of [/Project list:/, /project CLAUDE\.md under "Skills"/, /`Skills:` line per worker/, /names a design skill from the skill map/, /may CHANGE it/, /one resume of that same worker/, /never a new run or a fix round/]) assert.match(skills, re);
  for (const re of [/at most 2 per worker, or `none: <why>`/, /A Normal or Risky workflow that used none is not done/, /ends with `skills: <names>`/, /counts only under `~\/\.claude\/plugins\/cache\/` or `~\/\.claude\/skills\/`/, /never overrides the handbook, the security rules or an agent file/]) assert.match(skills, re);
  assert.doesNotMatch(skills, /does not cause a re-run/);
  assert.match(md, /report `Skills read: /);
  const fp = read('claude/agents/founder-proxy.md');
  for (const re of [/`Skills:` line per worker/, /names a design skill/, /unfit skill is CHANGES/, /slices sized by the work/,
    /diff files are within the slice's file list in the plan/, /every skill the plan assigned has its "Skills read:" line or a "skipped by" line/, /\(Tiny tasks do not come to you\)/,
    /Glob or Read it/, /is under ~\/\.claude\/plugins\/cache\/ or ~\/\.claude\/skills\/; any other path is CHANGES/, /any other path is CHANGES/, /`whole file` when the file has no headings/]) assert.match(fp, re);
  const pl = read('claude/agents/planner.md');
  assert.match(pl, /slices sized by the work/);
  assert.match(pl, /`Skills:` line/);
  const bts = read('claude/skills/brief-to-spec/SKILL.md');
  assert.match(bts, /^10\. Slices/m);
  assert.match(bts, /under `## Skills`/);
  assert.match(bts, /never drop section 7/);
  assert.match(read('claude/skills/new-project/SKILL.md'), /## Skills/);
  assert.match(read('claude/templates/project-CLAUDE.md'), /^## Skills/m);
  assert.match(read('claude/templates/project-CLAUDE.md'), /Changing this list is a founder decision/);
  assert.match(read('README.md'), /Tiny tasks \(text and docs only\) skip founder-proxy/);
  assert.match(pl, /Report: number of slices/);
});

test('caveman and ponytail reach every worker through the handbook', () => {
  const md = read('claude/CLAUDE.md');
  const style = (md.match(/^## Style[\s\S]*?(?=^## )/m) || [''])[0];
  assert.match(md, /^## Style$/m);
  for (const re of [/never drop not, never, no, only/, /smallest change that fully does the task/, /Never cut validation, permission checks, error handling or tests/, /`Skipped: /]) assert.match(style, re);
  assert.match(md, /Style, Hard rules and the security, scale and testing rules do/);
});

test('handbook stays within its line budget', () => {
  const md = read('claude/CLAUDE.md');
  assert.ok(md.trimEnd().split(/\r?\n/).length <= 205, 'handbook over 205 lines');
  assert.ok(Buffer.byteLength(md.replace(/\r\n/g, '\n')) <= 19600, 'handbook over 19600 bytes');
});
