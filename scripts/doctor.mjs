#!/usr/bin/env node
/**
 * `npm run doctor` — reports the environment facts that explain most
 * `next dev` problems on a developer machine. Read-only; changes nothing.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ok = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => console.log(`  ⚠ ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

console.log('\nEMS project doctor\n' + '─'.repeat(50));

console.log('\nProject');
console.log(`  path:   ${ROOT}`);
console.log(`  branch: ${sh('git rev-parse --abbrev-ref HEAD') || 'unknown'}`);
console.log(`  commit: ${sh('git rev-parse --short HEAD') || 'unknown'}`);

console.log('\nRuntime');
const major = Number(process.versions.node.split('.')[0]);
(major >= 20 ? ok : bad)(`Node ${process.versions.node}${major >= 20 ? '' : ' — Next 16 needs 20 or newer'}`);
console.log(`  platform: ${process.platform} ${os.arch()}`);
const gb = os.totalmem() / 1024 ** 3;
(gb >= 8 ? ok : warn)(`RAM ${gb.toFixed(1)}GB — the dev server alone uses ~1GB`);

// The big one: a lockfile above the project makes Turbopack watch that tree.
console.log('\nWorkspace root');
const LOCKS = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'];
let parent = path.dirname(ROOT);
const strays = [];
while (parent !== path.dirname(parent)) {
  for (const lock of LOCKS) {
    if (fs.existsSync(path.join(parent, lock))) strays.push(path.join(parent, lock));
  }
  parent = path.dirname(parent);
}
if (strays.length) {
  warn(`lockfile(s) found ABOVE the project:`);
  strays.forEach((f) => console.log(`      ${f}`));
  console.log('      next.config.mjs pins turbopack.root, so this should be contained.');
  console.log('      If dev still misbehaves, deleting or moving these helps.');
} else {
  ok('no stray lockfiles in any parent directory');
}

// Synced folders churn files underneath the watcher.
console.log('\nFile syncing');
const SYNCED = [
  ['iCloud Drive', /Library\/Mobile Documents|com~apple~CloudDocs/i],
  ['iCloud Desktop/Documents', /\/(Desktop|Documents)\//i],
  ['Dropbox', /\/Dropbox\//i],
  ['Google Drive', /\/Google ?Drive/i],
  ['OneDrive', /\/OneDrive/i],
];
const hits = SYNCED.filter(([, re]) => re.test(ROOT)).map(([n]) => n);
if (hits.length) {
  bad(`project sits in a synced location: ${hits.join(', ')}`);
  console.log('      The sync daemon rewrites files while the dev server watches them,');
  console.log('      which causes an endless rebuild loop. Move the project, e.g.:');
  console.log(`      mkdir -p ~/dev && mv "${ROOT}" ~/dev/`);
} else {
  ok('project is not in a synced folder');
}

console.log('\nConfiguration');
fs.existsSync(path.join(ROOT, '.env.local'))
  ? ok('.env.local present')
  : warn('.env.local missing — leads and AI generation stay disabled (see .env.example)');
fs.existsSync(path.join(ROOT, 'node_modules'))
  ? ok('node_modules installed')
  : bad('node_modules missing — run `npm install`');

const posts = path.join(ROOT, 'content', 'posts');
const count = fs.existsSync(posts) ? fs.readdirSync(posts).filter((f) => f.endsWith('.json')).length : 0;
console.log(`  articles: ${count}`);

console.log('\nIf `npm run dev` still floods the terminal, capture what repeats:');
console.log('  npm run dev 2>&1 | head -60\n');
