import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, hooks, nodes, deferred, textContent } from '../../../tests/frontend/componentHarness.mjs';

const { safeChatLink } = loadModule(new URL('../src/features/chat/safeChatLink.ts', import.meta.url));
test('Chat links accept known local routes and reject external, encoded or executable destinations', () => {
  for (const value of ['/', '/orders', '/products', '/products/12345678-1234-1234-1234-123456789abc']) assert.equal(safeChatLink(value), value);
  for (const value of ['https://evil.test', '//evil.test', 'javascript:alert(1)', 'data:text/html,test', '/\\evil.test', '/%2f%2fevil.test', '/orders?redirect=evil', '/unknown', '/orders\n']) assert.equal(safeChatLink(value), null, value);
});

test('Order attempt keeps its key for a retry and replaces it only when intent changes', () => {
  const { createOrderAttempt } = loadModule(new URL('../src/features/checkout/orderAttempt.ts', import.meta.url));
  const attempt = createOrderAttempt(); const first = attempt('order A');
  assert.equal(attempt('order A'), first); assert.notEqual(attempt('order B'), first);
});

test('Cart rejects overlapping mutations until server refresh finishes', async () => {
  const h = hooks(), request = deferred(), refresh = deferred(); let calls = 0;
  const { CartProvider } = loadModule(new URL('../src/context/CartContext.tsx', import.meta.url), {
    react: h.react,
    '@tanstack/react-query': { useQuery: () => ({ data: { items: [] } }), useQueryClient: () => ({ invalidateQueries: () => refresh.promise }) },
    '../lib/apiClient': { apiClient: { put: () => { calls++; return request.promise; } } },
    './ToastContext': { useToast: () => ({ warning() {}, success() {}, error() {} }) },
    '../lib/session': { useAccessToken: () => 'token' }
  });
  const render = () => h.render(() => CartProvider({ children: null })).props.value;
  const first = render().updateQuantity('row', 2);
  assert.equal(await render().updateQuantity('row', 2), false); assert.equal(calls, 1);
  request.resolve({ data: { isSuccess: true } }); await new Promise(setImmediate);
  assert.equal(render().isMutating, true);
  assert.equal(await render().updateQuantity('row', 3), false);
  refresh.resolve(); assert.equal(await first, true); assert.equal(render().isMutating, false);
  assert.equal(await render().updateQuantity('row', 3), true); assert.equal(calls, 2);
});

test('Verification is usable without registration state after reload, and can resend and verify', async () => {
  const h = hooks(), requests = [];
  const { VerifyEmailPage } = loadModule(new URL('../src/pages/VerifyEmailPage.tsx', import.meta.url), {
    react: h.react, 'react-router-dom': { Link: 'a', useLocation: () => ({ state: null }) },
    '../lib/apiClient': { apiClient: { post: async (url, body) => { requests.push({ url, body }); return { data: { isSuccess: true } }; } } }
  });
  const render = () => h.render(VerifyEmailPage);
  nodes(render(), n => n.type === 'input' && n.props.type === 'email')[0].props.onChange({ target: { value: 'user@example.test' } });
  nodes(render(), n => n.type === 'button' && n.props.type === 'button')[0].props.onClick(); await new Promise(setImmediate);
  assert.equal(requests[0].url, '/auth/resend-verification-code');
  assert.equal(nodes(render(), n => n.type === 'button' && n.props.type === 'button')[0].props.disabled, true);
  nodes(render(), n => n.type === 'input' && n.props.inputMode === 'numeric')[0].props.onChange({ target: { value: '123456' } });
  nodes(render(), n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert.deepEqual(requests[1], { url: '/auth/verify-email', body: { email: 'user@example.test', code: '123456' } });
  assert(textContent(render()).includes('Şimdi giriş yapabilirsiniz'));
});
