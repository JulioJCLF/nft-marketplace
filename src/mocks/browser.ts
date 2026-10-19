import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function enableMocking(): Promise<void> {
  const isMockEnabled =
    import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
    (import.meta.env.MODE !== 'production' || import.meta.env.VITE_ENABLE_MOCKS === 'true' || true)

  if (!isMockEnabled) {
    return
  }

  // Avoid initializing worker twice
  if ((window as unknown as { __msw_initialized?: boolean }).__msw_initialized) {
    return
  }
  ;(window as unknown as { __msw_initialized?: boolean }).__msw_initialized = true

  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
    console.log('[MSW] Mock Service Worker ativo e operacional.')
  } catch (error) {
    console.warn('[MSW] Falha ao registrar Service Worker:', error)
  }
}
