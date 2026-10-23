import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const load = (path, mocks = {}, development = false) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env.DEV', String(development));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => name in mocks ? mocks[name] : require(name), module.exports, module);
  return module.exports;
};
const security = load('../src/features/checkout/checkoutSecurity.ts');

test('Checkout offers hosted payment without collecting card details in any environment', () => {
  const text = node => node == null || typeof node === 'boolean' ? '' :
    Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
  for (const development of [true, false]) {
    const { PaymentMethodSection } = load('../src/components/checkout/PaymentMethodSection.tsx', { 'lucide-react': {} }, development);
    const displayed = text(PaymentMethodSection({ payableTotal: 100 }));
    assert.equal(displayed.includes('Doğrudan Kart Girişi'), false);
    assert.equal(displayed.includes('Kart Numarası'), false);
    assert.equal(displayed.includes('iyzico'), true);
  }
});

test('Payment return accepts actual backend order numbers and rejects forged formats', () => {
  assert.equal(security.sanitizeOrderNumber('NX-20261023-1234ABCD'), 'NX-20261023-1234ABCD');
  for (const value of ['NXR-2026-TEMP', 'NX-<script>', 'NX-20261023-1234ABCD?x=1', null])
    assert.equal(security.sanitizeOrderNumber(value), null);
});

test('Hosted checkout rejects executable URLs, lookalike hosts and userinfo', () => {
  assert.equal(security.getTrustedPaymentUrl('https://sandbox-cpp.iyzipay.com/checkout?token=test'), 'https://sandbox-cpp.iyzipay.com/checkout?token=test');
  for (const value of ['javascript:alert(1)', 'https://iyzipay.com.evil.example', 'https://evil@cpp.iyzipay.com', 'http://cpp.iyzipay.com', '//cpp.iyzipay.com', null])
    assert.equal(security.getTrustedPaymentUrl(value), null);
});

test('Result page shows success only after an authenticated server result', () => {
  const render = (paymentStatus, token = 'token') => {
    let request;
    const page = load('../src/pages/PaymentResultPage.tsx', {
      react: { useEffect: () => {} },
      'react-router-dom': { Link: 'a', useSearchParams: () => [new URLSearchParams('order=NX-20261023-1234ABCD')] },
      '@tanstack/react-query': { useQuery: options => { request = options; return { data: paymentStatus ? { paymentStatus, orderNumber: 'NX-20261023-1234ABCD' } : undefined }; } },
      '../lib/session': { useAccessToken: () => token },
      '../features/checkout/checkoutService': { checkoutService: {} },
      '../features/checkout/checkoutSecurity': security,
      '../context/CartContext': { useCart: () => ({ refreshCart() {} }) },
      '../components/checkout/OrderSuccessView': { OrderSuccessView: 'confirmed-payment' },
    });
    return { view: page.PaymentResultPage(), request };
  };
  assert.notEqual(render(undefined).view.type, 'confirmed-payment');
  assert.notEqual(render('UnderReview').view.type, 'confirmed-payment');
  assert.notEqual(render('RequiresAttention').view.type, 'confirmed-payment');
  assert.notEqual(render('Failed').view.type, 'confirmed-payment');
  assert.equal(render('Success').view.type, 'confirmed-payment');
  assert.equal(render(undefined, null).request.enabled, false);
  assert.notEqual(render('Success', null).view.type, 'confirmed-payment');
});
