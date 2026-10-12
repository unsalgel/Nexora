import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { resolve, promise }; };
function fixture() {
  const states = [], refs = []; let cursor = 0, refCursor = 0;
  const requests = new Map(); const upload = deferred();
  const products = ['A', 'B'].map(id => ({ id, name: id, sku: id, price: 10, stockQuantity: 5, categoryName: 'Category', brandName: 'Brand', isActive: true }));
  const mocks = {
    react: { __esModule: true, default: {}, useEffect: () => {}, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], x => { states[i] = typeof x === 'function' ? x(states[i]) : x; }]; }, useRef: initial => { const i = refCursor++; return refs[i] ??= { current: initial }; } },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }), useMutation: () => ({ mutate: () => {}, isPending: false }), useQuery: ({ queryKey }) => ({ data: { data: queryKey[0] === 'admin-products' ? { items: products, totalCount: 2, totalPages: 1 } : [] } }) },
    '../lib/apiClient': { apiClient: { get: url => { const d = deferred(); requests.set(url, d); return d.promise; } } },
    '../lib/uploadService': { uploadImage: () => upload.promise },
    '../context/AdminToastContext': { useAdminToast: () => ({ showToast: () => {} }) },
  };
  for (const [path, name] of [['products/VariantManager', 'VariantManager'], ['ui/Dialog', 'Dialog'], ['common/SafeImage', 'SafeImage'], ['ui/SearchableSelect', 'SearchableSelect'], ['ui/ConfirmModal', 'ConfirmModal'], ['ui/ToggleSwitch', 'ToggleSwitch'], ['ui/TableSkeleton', 'TableSkeleton']]) mocks['../components/' + path] = { [name]: name };
  const code = ts.transpileModule(readFileSync(new URL('../src/pages/ProductsPage.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => mocks[name] ?? require(name), module.exports, module);
  const render = () => { cursor = 0; refCursor = 0; return module.exports.ProductsPage(); };
  const all = (node, predicate) => {
    if (!node || typeof node !== 'object') return [];
    const children = [node.props?.children].flat(Infinity);
    return [...(predicate(node) ? [node] : []), ...children.flatMap(child => all(child, predicate))];
  };
  const nodes = predicate => all(render(), predicate);
  const open = i => nodes(n => n.type === 'button' && n.props['aria-label'] === 'Düzenle')[i].props.onClick();
  const close = () => nodes(n => n.type === 'button' && n.props['aria-label'] === 'Kapat')[0].props.onClick();
  const resolve = id => requests.get('/products/' + id).resolve({ data: { isSuccess: true, data: { ...products.find(p => p.id === id), version: id === 'A' ? 12 : 34, images: [] } } });
  return { open, close, resolve, nodes, upload };
}
test('An old product detail response cannot overwrite the newly selected product', async () => {
  const f = fixture(); const first = f.open(0); f.close(); const second = f.open(1);
  f.resolve('B'); await second; f.resolve('A'); await first;
  const values = f.nodes(n => n.type === 'input').map(n => n.props.value);
  assert(values.includes('B')); assert(!values.includes('A'));
});
test('An upload from a closed form cannot set the image of a different product', async () => {
  const f = fixture(); const first = f.open(0); f.resolve('A'); await first;
  const pending = f.nodes(n => n.type === 'input' && n.props.type === 'file')[0].props.onChange({ target: { files: [{ size: 10 }] } });
  f.close(); const second = f.open(1); f.resolve('B'); await second;
  f.upload.resolve({ isSuccess: true, url: 'https://example.test/old.png' }); await pending;
  assert(!f.nodes(n => n.props?.value === 'https://example.test/old.png' || n.props?.src === 'https://example.test/old.png').length);
});
