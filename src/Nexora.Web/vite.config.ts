import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backend = env.VITE_BACKEND_URL ? new URL(env.VITE_BACKEND_URL).origin : '';
  const api = env.VITE_API_URL?.startsWith('http') ? new URL(env.VITE_API_URL).origin : backend;
  const websocket = backend.replace(/^http/, 'ws');
  const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: " + backend + "; connect-src 'self' " + api + ' ' + backend + ' ' + websocket + "; object-src 'none'; base-uri 'self'; form-action 'self'";
  const security = { name: 'frontend-csp', apply: 'build' as const, transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' as const }] };
  return {
  plugins: [security,react()],
};
})
