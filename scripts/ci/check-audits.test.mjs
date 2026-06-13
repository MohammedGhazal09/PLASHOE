import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectReachablePackagePaths,
  evaluateAuditPolicy,
  isAcceptedFrontendToolingRisk,
} from './check-audits.mjs';

const packages = {
  '': {
    dependencies: {
      lodash: '4.17.21',
      'react-scripts': '5.0.1',
    },
  },
  'node_modules/lodash': {},
  'node_modules/react-scripts': {
    dependencies: {
      lodash: '4.17.21',
      webpack: '5.0.0',
      'webpack-dev-server': '4.0.0',
    },
  },
  'node_modules/webpack': {},
  'node_modules/webpack-dev-server': {
    dependencies: {
      ws: '8.0.0',
    },
  },
  'node_modules/ws': {},
  'node_modules/runtime-only': {},
};

test('collectReachablePackagePaths follows dependencies from react-scripts tooling', () => {
  const reachable = collectReachablePackagePaths(packages, ['react-scripts']);

  assert.equal(reachable.has('node_modules/react-scripts'), true);
  assert.equal(reachable.has('node_modules/webpack'), true);
  assert.equal(reachable.has('node_modules/ws'), true);
});

test('isAcceptedFrontendToolingRisk accepts only reachable tooling vulnerabilities', () => {
  const reachable = collectReachablePackagePaths(packages, ['react-scripts']);

  assert.equal(
    isAcceptedFrontendToolingRisk(
      { name: 'ws', isDirect: false, nodes: ['node_modules/ws'] },
      reachable
    ),
    true
  );
  assert.equal(
    isAcceptedFrontendToolingRisk(
      { name: 'ws', isDirect: false, nodes: ['node_modules/runtime-only'] },
      reachable
    ),
    false
  );
});

test('isAcceptedFrontendToolingRisk blocks direct accepted-name runtime dependencies', () => {
  const reachable = collectReachablePackagePaths(packages, ['react-scripts']);

  assert.equal(
    isAcceptedFrontendToolingRisk(
      { name: 'lodash', isDirect: true, nodes: ['node_modules/lodash'] },
      reachable
    ),
    false
  );
});

test('evaluateAuditPolicy reports direct accepted-name dependencies as blocking', () => {
  const reachable = collectReachablePackagePaths(packages, ['react-scripts']);
  const result = evaluateAuditPolicy({
    backend: { commandFailed: false, vulnerabilities: [] },
    frontend: {
      commandFailed: false,
      vulnerabilities: [
        { name: 'ws', severity: 'high', isDirect: false, nodes: ['node_modules/ws'] },
        {
          name: 'lodash',
          severity: 'high',
          isDirect: true,
          nodes: ['node_modules/lodash'],
        },
      ],
    },
    toolingPackagePaths: reachable,
  });

  assert.equal(result.acceptedFrontendCount, 1);
  assert.equal(result.passed, false);
  assert.deepEqual(result.frontendBlocking, ['lodash (high, direct)']);
});
