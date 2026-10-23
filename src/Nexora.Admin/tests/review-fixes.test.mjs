import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, hooks, nodes, textContent, deferred } from '../../../tests/frontend/componentHarness.mjs';

function fixture(page) {
  const h = hooks(), upload = deferred(), requests = [], mutations = [];
  const rows = ['A', 'B'].map(id => ({ id, name: id, code: id, logoUrl: '', isActive: true, discountType: 'Percentage', discountValue: 10,
    minimumOrderAmount: 200, maximumDiscountAmount: 100, totalUsageLimit: 100, currentUsageCount: 0, expirationDateUtc: '2030-12-01T00:00:00Z' }));
  const apiClient = Object.fromEntries(['get', 'post', 'put', 'patch'].map(method => [method, async (url, body) => {
    requests.push({ method, url, body });
    return { data: { isSuccess: true, data: method === 'get' ? rows : { ...rows[0], ...body } } };
  }]));
  // Coupons load through an effect; run that effect once after the initial render.
  const effects = [];
  h.react.useEffect = effect => effects.push(effect);
  const mocks = {
    react: h.react,
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }),
      useQuery: () => ({ data: { data: rows } }), useMutation: options => { mutations.push(options); return { isPending: false, mutate: options.mutationFn }; } },
    '../lib/apiClient': { apiClient }, '../lib/uploadService': { uploadImage: () => upload.promise },
    '../context/AdminToastContext': { useAdminToast: () => ({ showToast: () => {} }) }
  };
  for (const [path, name] of [['ui/Dialog','Dialog'],['common/SafeImage','SafeImage'],['ui/ConfirmModal','ConfirmModal'],['ui/ToggleSwitch','ToggleSwitch']]) mocks['../components/'+path] = { [name]: name };
  const component = loadModule(new URL(`../src/pages/${page}.tsx`, import.meta.url), mocks)[page];
  const render = () => { mutations.length = 0; return h.render(component); };
  const find = predicate => nodes(render(), predicate);
  return { rows, upload, requests, mutations, render, find, effects,
    click: label => find(n => n.type === 'button' && n.props['aria-label'] === label)[0].props.onClick(),
    change: (id, value) => find(n => n.props.id === id)[0].props.onChange({ target: { value } }) };
}

test('Closing coupon edit then opening create starts an empty POST form with correct title', async () => {
  const f = fixture('CouponsPage'); f.render(); f.effects[0](); await new Promise(setImmediate);
  f.click('Kuponu Düzenle');
  assert(textContent(f.render()).includes('Kuponu Düzenle'));
  f.find(n => n.type === 'Dialog')[0].props.onClose();
  f.find(n => n.type === 'button' && textContent(n) === 'Yeni Kupon Oluştur')[0].props.onClick();
  assert.equal(f.find(n => n.props.id === 'couponspage-field-1')[0].props.value, '');
  f.change('couponspage-field-1', 'NEW');
  await f.find(n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(f.requests.at(-1).method, 'post'); assert.equal(f.requests.at(-1).url, '/coupons');
});

for (const edit of [false, true]) test(`Fixed coupon sends no hidden maximum cap (edit=${edit})`, async () => {
  const f = fixture('CouponsPage'); f.render(); f.effects[0](); await new Promise(setImmediate);
  if (edit) f.click('Kuponu Düzenle');
  else f.find(n => n.type === 'button' && textContent(n) === 'Yeni Kupon Oluştur')[0].props.onClick();
  f.change('couponspage-field-1', 'FIXED200'); f.change('couponspage-field-2', 'FixedAmount'); f.change('couponspage-field-3', '200');
  await f.find(n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(f.requests.at(-1).body.maximumDiscountAmount, null);
  assert.equal(f.requests.at(-1).body.discountValue, 200);
});

test('Late brand upload cannot change another form, while active upload disables save', async () => {
  const f = fixture('BrandsPage'); f.click('Düzenle');
  const pending = f.find(n => n.type === 'input' && n.props.type === 'file')[0].props.onChange({ target: { files: [{}] } });
  assert.equal(f.find(n => n.type === 'button' && n.props.type === 'submit')[0].props.disabled, true);
  f.find(n => n.type === 'Dialog')[0].props.onClose();
  f.find(n => n.type === 'button' && n.props['aria-label'] === 'Düzenle')[1].props.onClick();
  f.upload.resolve({ isSuccess: true, url: '/uploads/old.webp' }); await pending;
  assert.equal(f.find(n => n.props.src === '/uploads/old.webp').length, 0);
  assert.equal(f.find(n => n.props.id === 'brandspage-field-1')[0].props.value, 'B');
});

for (const [page, entity, route] of [['BrandsPage','brand','brands'],['CategoriesPage','category','categories']]) {
  test(`${page} status sends only isActive to the narrow endpoint`, async () => {
    const f = fixture(page); f.render();
    await f.mutations[1].mutationFn({ [entity]: f.rows[0], newStatus: false });
    assert.deepEqual(f.requests.at(-1), { method: 'patch', url: `/${route}/A/status`, body: { isActive: false } });
  });
}
