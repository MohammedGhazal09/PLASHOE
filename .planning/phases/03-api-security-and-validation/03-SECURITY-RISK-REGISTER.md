# Phase 03 Security Risk Register

**Created:** 2026-06-12  
**Scope:** Production dependency audit residuals after Phase 03 targeted remediation.

## Recommendation

Do not force Express 5, Mongoose 9, React Router 7, React 19, or a CRA-to-Vite migration inside Phase 03. Backend production audit is clean after targeted upgrades and a narrow transitive override. Frontend direct runtime targets were upgraded successfully; the remaining frontend findings are accepted through Phase 03 because they are in the Create React App build/test/tooling graph, not the deployed static browser runtime. Track them for a dedicated frontend tooling migration phase.

## Audit Summary

| App | Command | Result | Decision |
| --- | --- | --- | --- |
| Backend | `npm audit --omit=dev` | Clean: 0 vulnerabilities | No accepted dependency risk remains. |
| Frontend | `npm audit --omit=dev` | Non-clean: 46 findings, 10 low, 14 moderate, 21 high, 1 critical | Accepted for Phase 03 with follow-up tooling migration. |

## Accepted Frontend Risk

| Package | Severity | Source package / chain | Exploitability notes | Accepted-risk rationale | Follow-up |
| --- | --- | --- | --- | --- | --- |
| `react-scripts` | high | Direct CRA build/test dependency | Build and dev-server tooling, not served as browser runtime code after `npm run build`. | Safe patch/minor upgrades do not remove this chain; migration is larger than Phase 03. | Frontend tooling migration phase. |
| `shell-quote` | critical | CRA tooling transitive | Command parsing risk in Node tooling paths. | Not reachable from deployed static storefront runtime; still unacceptable long term. | Frontend tooling migration phase. |
| `@babel/plugin-transform-modules-systemjs` | high | Babel tooling | Malicious compile input risk during build. | Build-time supply-chain risk, not browser runtime request surface. | Frontend tooling migration phase. |
| `@svgr/plugin-svgo` | high | `react-scripts` -> SVG transform tooling | Malicious SVG/build input risk. | Requires build-time asset processing path; no user-uploaded SVG build path exists in current app. | Frontend tooling migration phase. |
| `@svgr/webpack` | high | `react-scripts` SVG loader | Build-time SVG transform chain. | Deferred with CRA tooling migration; no runtime server exposure. | Frontend tooling migration phase. |
| `css-select` | high | `svgo` chain | Selector processing DoS risk in tooling. | Build-time only in current app. | Frontend tooling migration phase. |
| `fast-uri` | high | Build/test tooling transitive | URI parsing/path traversal advisory in Node package. | Not reachable from deployed static browser runtime. | Frontend tooling migration phase. |
| `flatted` | high | Build/test tooling transitive | Parse recursion/prototype pollution advisories. | No production API uses this package; audit presence comes from tooling graph. | Frontend tooling migration phase. |
| `jsonpath` | high | Build/test tooling transitive | Prototype pollution/code execution risk for JSONPath evaluation. | No app runtime JSONPath feature exists. | Frontend tooling migration phase. |
| `lodash` | high | Build/test tooling transitive | Template code injection/prototype pollution advisories. | Current browser bundle should be assessed during migration; no server runtime uses this frontend tree. | Frontend tooling migration phase. |
| `minimatch` | high | Build/test tooling transitive | ReDoS in glob matching. | Tooling path only; not a request path in deployed static app. | Frontend tooling migration phase. |
| `node-forge` | high | Build/test tooling transitive | Certificate validation advisories. | Not used by app runtime auth or TLS termination. | Frontend tooling migration phase. |
| `nth-check` | high | `svgo`/CSS tooling chain | ReDoS in selector parsing. | Build-time SVG/CSS optimization path only. | Frontend tooling migration phase. |
| `path-to-regexp` | high | Tooling/dev server Express chain | Route pattern ReDoS in Node tooling. | Not part of deployed backend; backend Express chain is clean separately. | Frontend tooling migration phase. |
| `picomatch` | high | Jest/Rollup/watch tooling | Glob matching ReDoS. | Test/build/watch path only. | Frontend tooling migration phase. |
| `rollup` | high | Workbox/build tooling | Arbitrary file write advisory in bundling tool. | Build-time risk only; no production Node process runs this package. | Frontend tooling migration phase. |
| `rollup-plugin-terser` | high | Workbox build chain | Minification/build plugin chain. | Build-time only and tied to CRA service-worker tooling. | Frontend tooling migration phase. |
| `serialize-javascript` | high | Minifier/build tooling | Serialization RCE/DoS advisories. | Not used as a server serialization layer; tied to bundling/minification. | Frontend tooling migration phase. |
| `svgo` | high | SVG optimization tooling | SVG entity expansion / selector chain. | Current app has no user-controlled build-time SVG ingestion path. | Frontend tooling migration phase. |
| `underscore` | high | `jsonpath` chain | Recursion DoS advisory. | Tooling graph only. | Frontend tooling migration phase. |
| `workbox-build` | high | `react-scripts` service-worker tooling | Build-time Workbox chain. | No runtime Node service exposure. | Frontend tooling migration phase. |
| `workbox-webpack-plugin` | high | `react-scripts` service-worker tooling | Build-time Workbox chain. | Deferred with CRA tooling migration. | Frontend tooling migration phase. |
| `ajv` | moderate | Build/test schema tooling | ReDoS advisory in schema validation. | Tooling graph only; backend runtime validation uses Zod. | Frontend tooling migration phase. |
| `body-parser` | moderate | Tooling/dev server Express chain | Transitive `qs` advisory. | Backend body-parser exposure is separately remediated; this is frontend tooling. | Frontend tooling migration phase. |
| `brace-expansion` | moderate | Build/test glob tooling | ReDoS/memory exhaustion advisory. | Test/build path only. | Frontend tooling migration phase. |
| `css-minimizer-webpack-plugin` | moderate | `react-scripts` minifier tooling | Build-time serialization chain. | No production runtime process. | Frontend tooling migration phase. |
| `express` | moderate | Tooling/dev server chain | Transitive `qs` advisory. | Not the backend Express app; backend audit is clean. | Frontend tooling migration phase. |
| `postcss` | moderate | CRA CSS tooling | CSS parsing/stringify advisory. | Build-time CSS processing path. | Frontend tooling migration phase. |
| `qs` | moderate | Tooling Express/body-parser chain | Query parsing DoS advisory. | Not reachable from deployed backend; frontend static runtime has no Node query parser. | Frontend tooling migration phase. |
| `resolve-url-loader` | moderate | `react-scripts` CSS loader | PostCSS chain. | Build-time only. | Frontend tooling migration phase. |
| `sockjs` | moderate | `webpack-dev-server` chain | Dev-server websocket dependency. | Development server only; never deploy `webpack-dev-server` publicly. | Frontend tooling migration phase. |
| `terser-webpack-plugin` | moderate | Build minifier tooling | Serialization chain. | Build-time only. | Frontend tooling migration phase. |
| `uuid` | moderate | `sockjs` chain | Buffer bounds advisory. | Dev-server chain only. | Frontend tooling migration phase. |
| `webpack-dev-server` | moderate | CRA dev server | Source exposure advisories for dev server. | Must not be used as production hosting; static build must be deployed instead. | Frontend tooling migration phase. |
| `ws` | moderate | `webpack-dev-server` chain | WebSocket dependency advisory. | Dev-server chain only. | Frontend tooling migration phase. |
| `yaml` | moderate | Build/test tooling transitive | Deep nesting stack overflow advisory. | Tooling graph only. | Frontend tooling migration phase. |
| `@jest/core` | low | Jest test tooling | Test runner chain. | Test-only path; not shipped. | Frontend tooling migration phase. |
| `@tootallnate/once` | low | `jsdom`/proxy tooling | Incorrect control-flow scoping. | Test tooling only. | Frontend tooling migration phase. |
| `http-proxy-agent` | low | `jsdom` test tooling | Proxy agent chain. | Test tooling only. | Frontend tooling migration phase. |
| `jest` | low | Jest test tooling | Test runner chain. | Test-only path. | Frontend tooling migration phase. |
| `jest-cli` | low | Jest test tooling | Test runner chain. | Test-only path. | Frontend tooling migration phase. |
| `jest-config` | low | Jest test tooling | Test runner config chain. | Test-only path. | Frontend tooling migration phase. |
| `jest-environment-jsdom` | low | Jest/jsdom test tooling | DOM test environment chain. | Test-only path. | Frontend tooling migration phase. |
| `jest-runner` | low | Jest test tooling | Test runner chain. | Test-only path. | Frontend tooling migration phase. |
| `jsdom` | low | Jest DOM test tooling | DOM test environment chain. | Test-only path. | Frontend tooling migration phase. |
| `webpack` | low | CRA build tooling | BuildHttp SSRF advisories require build feature exposure. | Build-time only; no production webpack server. | Frontend tooling migration phase. |

## Guardrails Until Follow-Up

- Deploy only the output of `npm run build`; do not expose `react-scripts start` or `webpack-dev-server` in production.
- Keep frontend dependency updates bounded to direct patch/minor updates until the tooling migration phase.
- Re-run `npm audit --omit=dev` before release and compare output to this register.
- Treat new direct runtime advisories in browser dependencies as blocking unless they are fixed or explicitly added here.
