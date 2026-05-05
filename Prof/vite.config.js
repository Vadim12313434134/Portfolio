import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const API_PROXY_TARGET = env.VITE_API_PROXY_TARGET || 'http://10.3.47.36:8081'
  const DEV_STUB_COOKIE = String(env.VITE_STUB_COOKIE || '').trim()
  const DEV_STUB_COOKIE_HEADER = String(env.VITE_STUB_COOKIE_HEADER || 'X-Stub-Cookie').trim()

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@store': path.resolve(__dirname, './src/store'),
        '@api': path.resolve(__dirname, './src/api'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@styles': path.resolve(__dirname, './src/styles'),
      }
    },
    server: {
      proxy: {
        '/api': {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')

              if (!DEV_STUB_COOKIE) return

              const requestCookieHeader = proxyReq.getHeader('cookie')
              if (requestCookieHeader) return

              const customStubCookieHeader = proxyReq.getHeader(DEV_STUB_COOKIE_HEADER)
              const resolvedStubCookie = String(customStubCookieHeader || DEV_STUB_COOKIE).trim()
              if (!resolvedStubCookie) return

              proxyReq.setHeader('cookie', resolvedStubCookie)
            })
          },
        },
      },
    },
  }
})
