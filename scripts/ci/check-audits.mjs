import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmAuditArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
  : ['audit', '--omit=dev', '--json'];

const acceptedFrontendToolingRisks = new Set([
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

function runAudit(label, relativeDirectory) {
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

function summarizeMetadata(metadata) {
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

function formatFinding(vulnerability) {
  const name = vulnerability.name || 'unknown';
  const severity = vulnerability.severity || 'unknown';
  const direct = vulnerability.isDirect ? 'direct' : 'transitive';
  return `${name} (${severity}, ${direct})`;
}

const backend = runAudit('backend', 'Backend');
const frontend = runAudit('frontend', 'Frontend/Ecommerce-main/my-app');

const backendBlocking = backend.commandFailed ? ['backend audit command failed'] : backend.vulnerabilities.map(formatFinding);
const frontendBlocking = frontend.commandFailed
  ? ['frontend audit command failed']
  : frontend.vulnerabilities
      .filter((vulnerability) => !acceptedFrontendToolingRisks.has(vulnerability.name))
      .map(formatFinding);

const acceptedFrontendCount = frontend.commandFailed
  ? 0
  : frontend.vulnerabilities.length - frontendBlocking.length;

console.log('Production dependency audit policy');
console.log(`Backend audit: ${summarizeMetadata(backend.metadata)}`);
console.log(`Frontend audit: ${summarizeMetadata(frontend.metadata)}`);
console.log(`Accepted frontend CRA/tooling findings: ${acceptedFrontendCount}`);

if (backendBlocking.length > 0) {
  console.error('\nBlocking backend production audit findings:');
  for (const finding of backendBlocking) console.error(`- ${finding}`);
}

if (frontendBlocking.length > 0) {
  console.error('\nBlocking frontend findings outside the accepted Phase 03 CRA/tooling risk boundary:');
  for (const finding of frontendBlocking) console.error(`- ${finding}`);
}

if (backend.commandFailed) {
  console.error(`\nBackend audit error: ${backend.error}`);
}

if (frontend.commandFailed) {
  console.error(`\nFrontend audit error: ${frontend.error}`);
}

if (backendBlocking.length > 0 || frontendBlocking.length > 0) {
  process.exitCode = 1;
} else {
  console.log('Audit policy passed.');
}
