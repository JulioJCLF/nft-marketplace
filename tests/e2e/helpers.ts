import { expect, Page } from '@playwright/test'

export async function resetMockDatabase(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const resetResult = await page.evaluate(async () => {
    localStorage.removeItem('nft_active_scenario')
    localStorage.removeItem('nft_auth_token')
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response = await fetch('/api/system/reset', { method: 'POST' })
        if (response.ok) return await response.json() as { success: boolean }
      } catch {
        // MSW's service worker may still be activating on the first load.
      }
      await new Promise((resolve) => window.setTimeout(resolve, 100))
    }
    return null
  })
  if (!resetResult?.success) throw new Error('MSW não confirmou o reset do estado antes do teste.')
  await page.reload()
  await page.waitForLoadState('networkidle')
}

export async function loginAsAlice(page: Page) {
  if (page.url() === 'about:blank') {
    await page.goto('/')
  }
  await page.evaluate(() => {
    localStorage.setItem('nft_auth_token', 'token-user-alice-01-1700000000000')
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  // Ensure user menu is settled
  await page.locator('[data-testid="navbar-user-menu"]').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
}

export async function waitForSocketConnection(page: Page, timeoutMs = 10000) {
  await page.evaluate(async (timeout) => {
    const getSocket = async () => {
      const win = window as unknown as {
        __kurio_socket__?: {
          connected: boolean
          on: (evt: string, fn: () => void) => void
          off: (evt: string, fn: () => void) => void
        }
      }
      if (win.__kurio_socket__) return win.__kurio_socket__
      try {
        const mod = await import('/src/realtime/socket.ts')
        return mod.socket
      } catch {
        for (let i = 0; i < 30; i += 1) {
          if (win.__kurio_socket__) return win.__kurio_socket__
          await new Promise((r) => window.setTimeout(r, 100))
        }
        throw new Error('Socket.IO client não encontrado na janela.')
      }
    }
    const socket = await getSocket()
    if (socket.connected) return

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        socket.off('connect', onConnect)
        reject(new Error('Socket.IO não conectou dentro do tempo esperado.'))
      }, timeout)
      const onConnect = () => {
        window.clearTimeout(timeoutId)
        socket.off('connect', onConnect)
        resolve()
      }
      socket.on('connect', onConnect)
      if (socket.connected) onConnect()
    })
  }, timeoutMs)
}

export async function openMobileFilterDrawerIfNeeded(page: Page) {
  const viewportWidth = page.viewportSize()?.width ?? 0
  if (viewportWidth < 1024) {
    await page.getByRole('button', { name: 'Filtros' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
}
