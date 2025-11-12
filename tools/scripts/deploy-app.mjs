#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);

function readProject() {
  for (const arg of args) {
    if (arg.startsWith('--project=')) {
      return arg.split('=')[1];
    }
  }

  if (process.env.NX_TASK_TARGET_PROJECT) {
    return process.env.NX_TASK_TARGET_PROJECT;
  }

  return args[0];
}

const project = readProject();

if (!project) {
  console.error('deploy-app: missing project name. Pass --project=api|auth.');
  process.exit(1);
}

const manifestByProject = {
  api: 'deploy/k8s/api.yaml',
  auth: 'deploy/k8s/auth.yaml',
};

const manifestRelative = manifestByProject[project];

if (!manifestRelative) {
  console.error(`deploy-app: project "${project}" is not configured for deploy.`);
  process.exit(1);
}

const manifest = resolve(manifestRelative);

if (!existsSync(manifest)) {
  console.error(`deploy-app: manifest not found at ${manifestRelative}`);
  process.exit(1);
}

const kubectlBin = process.env.KUBECTL_BIN ?? 'kubectl';
console.info(`Applying ${manifestRelative} via ${kubectlBin}...`);

const result = spawnSync(
  kubectlBin,
  ['apply', '-f', manifest],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

if (result.status !== 0) {
  console.error(`deploy-app: kubectl exited with code ${result.status ?? 'unknown'}`);
  process.exit(result.status ?? 1);
}

console.info(`deploy-app: ${project} manifest applied successfully.`);
