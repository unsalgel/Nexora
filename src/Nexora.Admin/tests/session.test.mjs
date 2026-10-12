import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import axiosTransport, { AxiosError } from 'axios';
const require = createRequire(import.meta.url);
const load = (path, mocks = {}) => {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => name in mocks ? mocks[name] : require(name), module.exports, module);
  return module.exports;
};
const { createRefreshCoordinator } = load('../src/lib/refreshCoordinator.ts');
const tokenSession = load('../src/lib/tokenSession.ts');
const jwt = (userId, sessionId, marker) => `e30.${Buffer.from(JSON.stringify({ nameid: userId, sid: sessionId, jti: marker })).toString('base64url')}.signature`;
const oldToken = jwt('user-a', 'session-a', 'old');
const freshToken = jwt('user-a', 'session-a', 'fresh');
const otherToken = jwt('user-b', 'session-b', 'other');

test('Concurrent refresh callers share one request and recover after rejection', async () => {
  const coordinate = createRefreshCoordinator(); let calls = 0;
  const refresh = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 2)); return 'token'; };
  assert.deepEqual(await Promise.all([coordinate(refresh), coordinate(refresh), coordinate(refresh)]), ['token', 'token', 'token']);
  assert.equal(calls, 1);
  await assert.rejects(coordinate(async () => { throw new Error('expired'); }));
  assert.equal(await coordinate(refresh), 'token'); assert.equal(calls, 2);
});

const clientFixture = (options = {}) => {
  let revision = 0; let handler; let posts = 0; let access = null; let refresh = null; let clearCalls = 0; let redirects = 0;
  let rejectDelayed, signalStarted;
  const started = new Promise(resolve => { signalStarted = resolve; });
  const mutations = [];
  const session = { canRestoreSession: () => true, getSessionRevision: () => revision, getAccessToken: () => access, getRefreshToken: () => refresh, setSessionTokens: (a, r) => { revision++; access = a; refresh = r; }, clearSession: () => { revision++; access = null; refresh = null; clearCalls++; } };
  const axios = {
    create: config => {
      const client = axiosTransport.create({ ...config, adapter: async request => {
        if (options.delayed401 && !request._retry) {
          signalStarted();
          return new Promise((_resolve, reject) => { rejectDelayed = () => reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', request, undefined, { status: 401, data: {}, headers: {}, config: request })); });
        }
        if (request.method === 'post' && request.url === '/cart/items') mutations.push(request.headers.Authorization);
        return { status: 200, statusText: 'OK', data: {}, headers: {}, config: request, authorization: request.headers.Authorization };
      } });
      const use = client.interceptors.response.use.bind(client.interceptors.response);
      client.interceptors.response.use = (success, failure) => { handler = failure; return use(success, failure); };
      return client;
    },
    post: async (_url, _payload, config) => {
      assert.equal(config.withCredentials, true);
      const requestAccess = access;
      posts++; await new Promise(resolve => setTimeout(resolve, 2));
      const claims = requestAccess ? JSON.parse(Buffer.from(requestAccess.split('.')[1], 'base64url')) : {};
      return { data: { isSuccess: true, data: { accessToken: jwt(claims.nameid, claims.sid, 'fresh'), refreshToken: 'rotated' } } };
    }
  };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: options.locks } });
  globalThis.window = { location: { assign: () => { redirects++; } } };
  const { apiClient, logout } = load('../src/lib/apiClient.ts', { axios: { __esModule: true, default: axios }, './env': { ENV: { API_URL: 'http://localhost/api' } }, './session': session, './refreshCoordinator': { createRefreshCoordinator }, './tokenSession': tokenSession });
  return {
    reject401: (failedToken = oldToken) => handler({ response: { status: 401 }, config: { url: '/orders', headers: { Authorization: `Bearer ${failedToken}` } } }),
    postCart: () => apiClient.post('/cart/items', { productId: 'product-a', quantity: 1 }),
    failDelayed: () => rejectDelayed(), started, mutations, logout,
    setTokens: session.setSessionTokens, posts: () => posts, clearCalls: () => clearCalls, redirects: () => redirects, session
  };
};
test('A missing-token 401 settles and does not poison the next authenticated refresh', async () => {
  const f = clientFixture();
  await assert.rejects(f.reject401()); assert.equal(f.clearCalls(), 1);
  f.setTokens(oldToken, 'refresh'); assert.equal((await f.reject401()).authorization, `Bearer ${freshToken}`); assert.equal(f.posts(), 1);
});
test('Concurrent 401 requests retry with a single rotated token', async () => {
  const f = clientFixture(); f.setTokens(oldToken, 'refresh');
  const results = await Promise.all([f.reject401(), f.reject401(), f.reject401()]);
  assert.equal(f.posts(), 1); assert.ok(results.every(result => result.authorization === `Bearer ${freshToken}`));
});
test('A delayed 401 from the previous token reuses the current token', async () => {
  const f = clientFixture(); f.setTokens(freshToken, 'rotated');
  assert.equal((await f.reject401(oldToken)).authorization, `Bearer ${freshToken}`); assert.equal(f.posts(), 0);
});
test('A refresh response cannot resurrect a logged out session', async () => {
  const f = clientFixture(); f.setTokens(oldToken, 'refresh'); const pending = f.reject401();
  await Promise.resolve(); await Promise.resolve(); f.session.clearSession();
  await assert.rejects(pending); assert.equal(f.session.getAccessToken(), null);
});
test('Hub retries an initial connection failure and cancels retries after disposal', async () => {
  const { startHubConnection } = load('../src/lib/startHubConnection.ts');
  let attempts = 0, onClose, stopped = 0;
  const stop = startHubConnection({ start: async () => { if (++attempts === 1) throw new Error('offline'); }, stop: async () => { stopped++; }, onclose: fn => { onClose = fn; } }, 1);
  await new Promise(resolve => setTimeout(resolve, 20)); assert.equal(attempts, 2);
  stop(); onClose(); await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(attempts, 2); assert.equal(stopped, 1);
});

test('Tokens stay in memory and old browser storage is removed', () => {
  const stored = {};
  const storage = { getItem: key => stored[key] ?? null, setItem: (key, value) => { stored[key] = value; Object.defineProperty(storage, key, { configurable: true, enumerable: true, value }); }, removeItem: key => { delete stored[key]; delete storage[key]; } };
  globalThis.localStorage = storage; globalThis.sessionStorage = { removeItem: () => {} };
  globalThis.window = new EventTarget();
  const session = load('../src/lib/session.ts', { './tokenSession': tokenSession }); let observed = [];
  window.addEventListener('nexora:session-changed', () => observed.push(session.getAccessToken()));
  window.addEventListener('nexora:admin-session-changed', () => observed.push(session.getAccessToken()));
  session.setSessionTokens('access', 'refresh'); session.clearSession();
  assert.deepEqual(observed, ['access', null]);
  assert.equal(Object.values(stored).includes('access'), false);
  assert.equal(Object.values(stored).includes('refresh'), false);
  if (session.CHAT_STORAGE_PREFIX) {
    storage.setItem(session.CHAT_STORAGE_PREFIX + 'user-a', 'secret'); storage.setItem('nexora_ai_chat_history', 'legacy'); session.clearSession();
    assert.equal(storage.getItem(session.CHAT_STORAGE_PREFIX + 'user-a'), null); assert.equal(storage.getItem('nexora_ai_chat_history'), null);
  }
});

test('Dialog traps Tab in both directions, closes with Escape, and restores focus', () => {
  const effects = [];
  const { Dialog } = load('../src/components/ui/Dialog.tsx', { react: { useRef: value => ({ current: value }), useEffect: callback => effects.push(callback) } });
  const listeners = new Map();
  globalThis.document = { activeElement: null, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  class Element { focus() { document.activeElement = this; } getClientRects() { return [1]; } }
  globalThis.HTMLElement = Element;
  const previous = new Element(), first = new Element(), last = new Element(), container = new Element();
  container.querySelectorAll = () => [first, last]; previous.focus(); let closed = 0;
  const element = Dialog({ label: 'Test', children: null, onClose: () => closed++ });
  element.props.ref(container); const cleanup = effects[0](); assert.equal(document.activeElement, first);
  let prevented = 0; const key = (key, shiftKey = false) => listeners.get('keydown')({ key, shiftKey, preventDefault: () => prevented++ });
  last.focus(); key('Tab'); assert.equal(document.activeElement, first);
  key('Tab', true); assert.equal(document.activeElement, last);
  key('Escape'); assert.equal(closed, 1); assert.equal(prevented, 3);
  cleanup(); assert.equal(document.activeElement, previous); assert.equal(listeners.size, 0);
});

test('An old refresh failure preserves a newer login session', async () => {
  const f = clientFixture(); f.setTokens(oldToken, 'refresh'); const pending = f.reject401();
  await Promise.resolve(); await Promise.resolve(); f.setTokens(otherToken, 'other-refresh');
  await assert.rejects(pending); assert.equal(f.session.getAccessToken(), otherToken); assert.equal(f.clearCalls(), 0);
});

test('A delayed POST 401 cannot retry after logout and another user login', async () => {
  const f = clientFixture({ delayed401: true }); f.setTokens(oldToken, 'refresh');
  const pending = f.postCart(); await f.started;
  f.session.clearSession(); f.setTokens(otherToken, 'other-refresh'); f.failDelayed();
  await assert.rejects(pending, /Oturum değişti/);
  assert.equal(f.session.getAccessToken(), otherToken); assert.equal(f.session.getRefreshToken(), 'other-refresh');
  assert.deepEqual(f.mutations, []); assert.equal(f.posts(), 0); assert.equal(f.clearCalls(), 1); assert.equal(f.redirects(), 0);
});

test('A delayed POST 401 cannot retry in a new session of the same user', async () => {
  const f = clientFixture({ delayed401: true }); f.setTokens(oldToken, 'refresh');
  const pending = f.postCart(); await f.started;
  const nextSession = jwt('user-a', 'session-new', 'new-login');
  f.setTokens(nextSession, 'new-refresh'); f.failDelayed();
  await assert.rejects(pending, /Oturum değişti/);
  assert.equal(f.session.getAccessToken(), nextSession); assert.equal(f.session.getRefreshToken(), 'new-refresh');
  assert.deepEqual(f.mutations, []); assert.equal(f.posts(), 0); assert.equal(f.clearCalls(), 0);
});

test('A delayed POST 401 reuses a rotation in the same user and session', async () => {
  const f = clientFixture({ delayed401: true }); f.setTokens(oldToken, 'refresh');
  const pending = f.postCart(); await f.started;
  f.setTokens(freshToken, 'rotated'); f.failDelayed();
  assert.equal((await pending).authorization, `Bearer ${freshToken}`);
  assert.deepEqual(f.mutations, [`Bearer ${freshToken}`]); assert.equal(f.posts(), 0); assert.equal(f.clearCalls(), 0);
});

test('Tokens without a session claim or with invalid payloads never match', () => {
  const noSession = `e30.${Buffer.from(JSON.stringify({ nameid: 'user-a' })).toString('base64url')}.sig`;
  assert.equal(tokenSession.isSameTokenSession(noSession, noSession), false);
  assert.equal(tokenSession.isSameTokenSession('invalid', oldToken), false);
  assert.equal(tokenSession.isSameTokenSession(oldToken, null), false);
});

test('A delayed logout revoke response does not redirect a newer login', async () => {
  const f = clientFixture(); f.setTokens(oldToken, 'refresh');
  const pending = f.logout(); f.setTokens(otherToken, 'other-refresh'); await pending;
  assert.equal(f.session.getAccessToken(), otherToken); assert.equal(f.session.getRefreshToken(), 'other-refresh');
  assert.equal(f.clearCalls(), 1); assert.equal(f.redirects(), 0);
});

test('A new user refresh cannot join a pending refresh from the old session', async () => {
  const f = clientFixture(); f.setTokens(oldToken, 'refresh');
  const oldFailure = assert.rejects(f.reject401());
  await Promise.resolve(); await Promise.resolve();
  f.session.clearSession(); f.setTokens(otherToken, 'other-refresh');
  const result = await f.reject401(otherToken); await oldFailure;
  const rotatedOther = jwt('user-b', 'session-b', 'fresh');
  assert.equal(result.authorization, `Bearer ${rotatedOther}`);
  assert.equal(f.session.getAccessToken(), rotatedOther); assert.equal(f.session.getRefreshToken(), undefined);
  assert.equal(f.posts(), 2); assert.equal(f.clearCalls(), 1); assert.equal(f.redirects(), 0);
});

test('A refresh waiting for the cross-tab lock rejects after a session switch', async () => {
  let releaseLock, enteredLock;
  const gate = new Promise(resolve => { releaseLock = resolve; });
  const entered = new Promise(resolve => { enteredLock = resolve; });
  const f = clientFixture({ locks: { request: async (_name, refresh) => { enteredLock(); await gate; return refresh(); } } });
  f.setTokens(oldToken, 'refresh'); const failure = assert.rejects(f.reject401(), /Oturum değişti/);
  await entered; f.setTokens(otherToken, 'other-refresh'); releaseLock(); await failure;
  assert.equal(f.session.getAccessToken(), otherToken); assert.equal(f.session.getRefreshToken(), 'other-refresh');
  assert.equal(f.posts(), 0); assert.equal(f.clearCalls(), 0); assert.equal(f.redirects(), 0);
});
