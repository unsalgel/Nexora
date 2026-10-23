import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export function loadModule(url, mocks = {}) {
  const require = createRequire(url);
  const ts = require('typescript');
  const code = ts.transpileModule(readFileSync(url, 'utf8'), {
    fileName: url.pathname,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => mocks[name] ?? require(name), module.exports, module);
  return module.exports;
}

export const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { resolve, reject, promise };
};

// Deterministic component event harness; not a replacement for browser layout tests.
export function hooks() {
  const state = [], refs = []; let cursor = 0, refCursor = 0;
  const react = {
    useState: initial => {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    },
    useRef: initial => refs[refCursor++] ??= { current: initial },
    useEffect: () => {}, useMemo: fn => fn(), useCallback: fn => fn,
    createContext: () => ({ Provider: 'Provider' })
  };
  return { react: { __esModule: true, default: react, ...react }, render: component => {
    cursor = 0; refCursor = 0; return component();
  } };
}

export function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}

export function textContent(tree) {
  if (tree == null || typeof tree === 'boolean') return '';
  if (Array.isArray(tree)) return tree.map(textContent).join('');
  return typeof tree === 'object' ? textContent(tree.props?.children) : String(tree);
}
