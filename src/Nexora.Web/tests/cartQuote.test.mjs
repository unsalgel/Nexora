import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const load = (path, mocks = {}) => {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => name in mocks ? mocks[name] : require(name), module.exports, module);
  return module.exports;
};
const cartQuote = load('../src/lib/cartQuote.ts');
const items = Object.freeze([
  Object.freeze({ id: 'parent-row', productId: 'product', productName: 'Ana ürün', quantity: 2, unitPrice: 50, totalPrice: 100 }),
  Object.freeze({ id: 'variant-row', productId: 'product', productVariantId: 'variant', productName: 'Varyant', quantity: 1, unitPrice: 11, totalPrice: 11 })
]);
const quote = {
  subtotal: 222, shippingFee: 29.9, discountAmount: 10, totalAmount: 241.9,
  items: [
    { cartItemId: 'variant-row', quantity: 1, unitPrice: 22, totalPrice: 22 },
    { cartItemId: 'parent-row', quantity: 2, unitPrice: 100, totalPrice: 200 }
  ]
};

const orderSummarySection = load('../src/components/checkout/OrderSummarySection.tsx', {
  'lucide-react': {},
  '../common/SafeImage': { SafeImage: 'img' },
  '../common/CouponBox': { CouponBox: () => null }
});

const textContent = node => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (typeof node.type === 'function') return textContent(node.type(node.props));
  return textContent(node.props?.children);
};

for (const page of ['CartPage', 'CheckoutPage']) {
  test(`${page} uses one current quote for parent/variant rows, subtotal, shipping and total`, () => {
    const component = load(`../src/pages/${page}.tsx`, {
      react: { __esModule: true, default: {}, useState: value => [value, () => {}], useMemo: callback => callback(), useEffect: () => {}, useRef: value => ({ current: value }) },
      '../features/checkout/orderAttempt': load('../src/features/checkout/orderAttempt.ts'),
      'react-router-dom': { Link: 'a', useNavigate: () => () => {} },
      '../hooks/useCartQuote': { useCartQuote: () => ({ data: quote, isFetching: false, isError: false }) },
      '../lib/cartQuote': cartQuote,
      '../context/CartContext': { useCart: () => ({ cart: { items, grandTotal: 111 }, isMutating: false }) },
      '../context/SettingsContext': { useSettings: () => ({ settings: { freeShippingThreshold: 500, shippingCost: 29.9 } }) },
      '../context/ToastContext': { useToast: () => ({ showToast: () => {} }) },
      '../lib/apiClient': { extractApiErrorMessage: () => 'Hata' },
      '../lib/session': { getAccessToken: () => null },
      '../components/common/SafeImage': { SafeImage: 'img' },
      '../components/common/EmptyState': { EmptyState: 'div' },
      '../components/common/CouponBox': { CouponBox: () => null },
      '../data/turkeyLocations': { TURKEY_CITIES: [] },
      '../components/ui/SearchableSelect': { SearchableSelect: 'select' },
      '../lib/cardValidation': { getCardBrand: () => 'unknown' },
      '../components/checkout/ShippingAddressSection': { ShippingAddressSection: () => null },
      '../components/checkout/PaymentMethodSection': { PaymentMethodSection: () => null },
      '../components/checkout/IyzicoPaymentModal': { IyzicoPaymentModal: () => null },
      '../features/checkout/checkoutService': { checkoutService: { fetchAddresses: async () => [], saveAddress: async () => null, initializePayment: async () => ({}), submitDirectOrder: async () => ({}) } },
      '../features/checkout/addressUtils': { formatFullShippingAddress: () => '', validateAddressFormData: () => ({ isValid: true }) },
      '../features/checkout/checkoutSecurity': { sanitizeOrderNumber: () => null, sanitizePaymentErrorMessage: () => null, clearPaymentQueryParams: () => {} },
      '../components/checkout/OrderSummarySection': orderSummarySection,
      '../components/checkout/OrderSuccessView': { OrderSuccessView: () => null }
    });
    const displayed = textContent(component[page]());
    assert.ok(displayed.includes('200,00 TL'));
    assert.ok(displayed.includes('22,00 TL'));
    assert.ok(displayed.includes('222,00 TL'));
    assert.ok(displayed.includes('29,90 TL'));
    assert.ok(displayed.includes('241,90'));
    assert.ok(!displayed.includes('111,00 TL'));
    assert.ok(!displayed.includes('11,00 TL'));
  });
}

test('Quote row lookup keeps item controls and tolerates the legacy nullable item snapshot', () => {
  const current = cartQuote.getQuotedCartItems(items, quote);
  assert.deepEqual(current.map(item => [item.id, item.quantity, item.unitPrice, item.totalPrice]), [['parent-row', 2, 100, 200], ['variant-row', 1, 22, 22]]);
  assert.equal(current[1].productVariantId, 'variant');
  assert.equal(items[0].unitPrice, 50);
  assert.equal(cartQuote.getQuotedCartItems(items, { ...quote, items: null }), items);
});
