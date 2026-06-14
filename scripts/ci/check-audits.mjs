import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmAuditArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
  : ['audit', '--omit=dev', '--json'];

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

export function evaluateAuditPolicy({ backend, frontend }) {
  const backendBlocking = backend.commandFailed
    ? ['backend audit command failed']
    : backend.vulnerabilities.map(formatFinding);
  const frontendBlocking = frontend.commandFailed
    ? ['frontend audit command failed']
    : frontend.vulnerabilities.map(formatFinding);

  return {
    backendBlocking,
    frontendBlocking,
    passed: backendBlocking.length === 0 && frontendBlocking.length === 0,
  };
}

export function main() {
  const backend = runAudit('backend', 'Backend');
  const frontend = runAudit('frontend', 'Frontend/Ecommerce-main/my-app');
  const result = evaluateAuditPolicy({ backend, frontend });

  console.log('Production dependency audit policy');
  console.log(`Backend audit: ${summarizeMetadata(backend.metadata)}`);
  console.log(`Frontend audit: ${summarizeMetadata(frontend.metadata)}`);

  if (result.backendBlocking.length > 0) {
    console.error('\nBlocking backend production audit findings:');
    for (const finding of result.backendBlocking) console.error(`- ${finding}`);
  }

  if (result.frontendBlocking.length > 0) {
    console.error('\nBlocking frontend production audit findings:');
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
