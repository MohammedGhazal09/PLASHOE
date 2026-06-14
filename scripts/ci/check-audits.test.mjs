import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAuditPolicy } from './check-audits.mjs';

const cleanReport = {
  commandFailed: false,
  vulnerabilities: [],
};

test('evaluateAuditPolicy blocks backend vulnerabilities', () => {
  const result = evaluateAuditPolicy({
    backend: {
      commandFailed: false,
      vulnerabilities: [
        { name: 'mongoose', severity: 'high', isDirect: true },
        { name: 'path-to-regexp', severity: 'moderate', isDirect: false },
      ],
    },
    frontend: cleanReport,
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.backendBlocking, [
    'mongoose (high, direct)',
    'path-to-regexp (moderate, transitive)',
  ]);
  assert.deepEqual(result.frontendBlocking, []);
});

test('evaluateAuditPolicy blocks frontend vulnerabilities', () => {
  const result = evaluateAuditPolicy({
    backend: cleanReport,
    frontend: {
      commandFailed: false,
      vulnerabilities: [
        { name: 'axios', severity: 'high', isDirect: true },
        { name: 'postcss', severity: 'moderate', isDirect: false },
      ],
    },
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.backendBlocking, []);
  assert.deepEqual(result.frontendBlocking, [
    'axios (high, direct)',
    'postcss (moderate, transitive)',
  ]);
});

test('evaluateAuditPolicy blocks command failures', () => {
  const result = evaluateAuditPolicy({
    backend: { commandFailed: true, vulnerabilities: [] },
    frontend: { commandFailed: true, vulnerabilities: [] },
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.backendBlocking, ['backend audit command failed']);
  assert.deepEqual(result.frontendBlocking, ['frontend audit command failed']);
});

test('evaluateAuditPolicy passes clean backend and frontend reports', () => {
  const result = evaluateAuditPolicy({
    backend: cleanReport,
    frontend: cleanReport,
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.backendBlocking, []);
  assert.deepEqual(result.frontendBlocking, []);
});
