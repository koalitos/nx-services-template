#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const base =
  process.env.NX_BASE ??
  process.env.BASE_REF ??
  process.env.GITHUB_BASE_REF ??
  'origin/main';

const head =
  process.env.NX_HEAD ??
  process.env.HEAD_REF ??
  process.env.GITHUB_HEAD_REF ??
  'HEAD';

const cmd = 'npx';
const args = ['nx', 'affected', '--target=deploy', `--base=${base}`, `--head=${head}`];

console.info(`Running ${cmd} ${args.join(' ')} ...`);

const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });

if (result.status !== 0) {
  console.error('deploy-affected: nx affected failed.');
  process.exit(result.status ?? 1);
}
