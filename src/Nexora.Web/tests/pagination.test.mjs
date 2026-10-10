import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const module = { exports: {} };
new Function('exports', 'module', ts.transpileModule(readFileSync(new URL('../src/lib/pagination.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module.exports, module);
const { getPageWindow } = module.exports;
test('Pagination bounds thousands of pages without hiding navigation to the ends', () => {
  assert.deepEqual(getPageWindow(1, 10000), [1, 2, 3, 4, 5]);
  assert.deepEqual(getPageWindow(5000, 10000), [4998, 4999, 5000, 5001, 5002]);
  assert.deepEqual(getPageWindow(10000, 10000), [9996, 9997, 9998, 9999, 10000]);
  assert.deepEqual(getPageWindow(1, 0), []); assert.deepEqual(getPageWindow(1, 2), [1, 2]);
});
