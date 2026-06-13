import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmAuditArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
  : ['audit', '--omit=dev', '--json'];

export const acceptedFrontendToolingRisks = new Set([
  '@babel/plugin-transform-modules-systemjs',
  '@jest/core',
  '@svgr/plugin-svgo',
  '@svgr/webpack',
  '@tootallnate/once',
  'ajv',
  'body-parser',
  'brace-expansion',
  'css-minimizer-webpack-plugin',
  'css-select',
  'express',
  'fast-uri',
  'flatted',
  'http-proxy-agent',
  'jest',
  'jest-cli',
  'jest-config',
  'jest-environment-jsdom',
  'jest-runner',
  'jsdom',
  'jsonpath',
  'lodash',
  'minimatch',
  'node-forge',
  'nth-check',
  'path-to-regexp',
  'picomatch',
  'postcss',
  'qs',
  'react-scripts',
  'resolve-url-loader',
  'rollup',
  'rollup-plugin-terser',
  'serialize-javascript',
  'shell-quote',
  'sockjs',
  'svgo',
  'terser-webpack-plugin',
  'underscore',
  'uuid',
  'webpack',
  'webpack-dev-server',
  'workbox-build',
  'workbox-webpack-plugin',
  'ws',
  'yaml',
]);

export const acceptedFrontendDirectToolingRisks = new Set(['react-scripts']);
export const acceptedFrontendToolingRoots = ['react-scripts'];

function dependencyPackagePath(parentPath, dependencyName, packages) {
  const segments = parentPath ? parentPath.split('/') : [];

  for (let index = segments.length; index >= 0; index -= 1) {
    const base = segments.slice(0, index).join('/');
    const candidate = base
      ? `${base}/node_modules/${dependencyName}`
      : `node_modules/${dependencyName}`;

    if (packages[candidate]) {
      return candidate;
    }
  }

  return null;
}

export function collectReachablePackagePaths(packages, rootPackageNames) {
  const reachable = new Set();
  const stack = rootPackageNames
    .map((packageName) => `node_modules/${packageName}`)
    .filter((packagePath) => packages[packagePath]);

  while (stack.length > 0) {
    const packagePath = stack.pop();

    if (!packagePath || reachable.has(packagePath)) {
      continue;
    }

    reachable.add(packagePath);

    const packageInfo = packages[packagePath] || {};
    const dependencies = {
      ...(packageInfo.dependencies || {}),
      ...(packageInfo.optionalDependencies || {}),
    };

    for (const dependencyName of Object.keys(dependencies)) {
      const dependencyPath = dependencyPackagePath(packagePath, dependencyName, packages);

      if (dependencyPath && !reachable.has(dependencyPath)) {
        stack.push(dependencyPath);
      }
    }
  }

  return reachable;
}

export function loadToolingPackagePaths(relativeLockfilePath) {
  const lockfilePath = path.join(root, relativeLockfilePath);
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  return collectReachablePackagePaths(lockfile.packages || {}, acceptedFrontendToolingRoots);
}

export function isAcceptedFrontendToolingRisk(vulnerability, toolingPackagePaths) {
  if (!acceptedFrontendToolingRisks.has(vulnerability.name)) {
    return false;
  }

  const nodes = vulnerability.nodes || [];

  if (nodes.length === 0 || !nodes.every((nodePath) => toolingPackagePaths.has(nodePath))) {
    return false;
  }

  if (vulnerability.isDirect) {
    return acceptedFrontendDirectToolingRisks.has(vulnerability.name);
  }

  return true;
}

export function runAudit(label, relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const result = spawnSync(npmCommand, npmAuditArgs, {
    cwd: directory,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    return {
      label,
      ok: false,
      commandFailed: true,
      error: result.error.message,
      vulnerabilities: [],
      metadata: null,
    };
  }

  const raw = result.stdout || result.stderr || '';

  try {
    const report = JSON.parse(raw || '{}');
    return {
      label,
      ok: result.status === 0,
      commandFailed: false,
      exitCode: result.status,
      vulnerabilities: Object.values(report.vulnerabilities || {}),
      metadata: report.metadata || null,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      commandFailed: true,
      error: `Could not parse npm audit JSON: ${error.message}`,
      raw: raw.slice(0, 1000),
      vulnerabilities: [],
      metadata: null,
    };
  }
}

export function summarizeMetadata(metadata) {
  const vulnerabilities = metadata?.vulnerabilities;
  if (!vulnerabilities) return 'unknown';

  return [
    `total=${vulnerabilities.total ?? 0}`,
    `critical=${vulnerabilities.critical ?? 0}`,
    `high=${vulnerabilities.high ?? 0}`,
    `moderate=${vulnerabilities.moderate ?? 0}`,
    `low=${vulnerabilities.low ?? 0}`,
  ].join(', ');
}

export function formatFinding(vulnerability) {
  const name = vulnerability.name || 'unknown';
  const severity = vulnerability.severity || 'unknown';
  const direct = vulnerability.isDirect ? 'direct' : 'transitive';
  return `${name} (${severity}, ${direct})`;
}

export function evaluateAuditPolicy({ backend, frontend, toolingPackagePaths }) {
  const backendBlocking = backend.commandFailed
    ? ['backend audit command failed']
    : backend.vulnerabilities.map(formatFinding);
  const frontendBlocking = frontend.commandFailed
    ? ['frontend audit command failed']
    : frontend.vulnerabilities
        .filter((vulnerability) => !isAcceptedFrontendToolingRisk(vulnerability, toolingPackagePaths))
        .map(formatFinding);
  const acceptedFrontendCount = frontend.commandFailed
    ? 0
    : frontend.vulnerabilities.length - frontendBlocking.length;

  return {
    backendBlocking,
    frontendBlocking,
    acceptedFrontendCount,
    passed: backendBlocking.length === 0 && frontendBlocking.length === 0,
  };
}

export function main() {
  const backend = runAudit('backend', 'Backend');
  const frontend = runAudit('frontend', 'Frontend/Ecommerce-main/my-app');
  const toolingPackagePaths = loadToolingPackagePaths(
    'Frontend/Ecommerce-main/my-app/package-lock.json'
  );
  const result = evaluateAuditPolicy({ backend, frontend, toolingPackagePaths });

  console.log('Production dependency audit policy');
  console.log(`Backend audit: ${summarizeMetadata(backend.metadata)}`);
  console.log(`Frontend audit: ${summarizeMetadata(frontend.metadata)}`);
  console.log(`Accepted frontend CRA/tooling findings: ${result.acceptedFrontendCount}`);

  if (result.backendBlocking.length > 0) {
    console.error('\nBlocking backend production audit findings:');
    for (const finding of result.backendBlocking) console.error(`- ${finding}`);
  }

  if (result.frontendBlocking.length > 0) {
    console.error('\nBlocking frontend findings outside the accepted Phase 03 CRA/tooling risk boundary:');
    for (const finding of result.frontendBlocking) console.error(`- ${finding}`);
  }

  if (backend.commandFailed) {
    console.error(`\nBackend audit error: ${backend.error}`);
  }

  if (frontend.commandFailed) {
    console.error(`\nFrontend audit error: ${frontend.error}`);
  }

  if (result.passed) {
    console.log('Audit policy passed.');
  } else {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
