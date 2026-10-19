import { Page } from '@playwright/test'

export async function resetMockDatabase(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.removeItem('nft_active_scenario')
    localStorage.removeItem('nft_auth_token')
    try {
      await fetch('/api/system/reset', { method: 'POST' })
    } catch {
      // ignore
    }
  })
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

export async function openMobileFilterDrawerIfNeeded(page: Page) {
  const isDesktopSidebarVisible = await page.locator('aside').isVisible().catch(() => false)
  if (!isDesktopSidebarVisible) {
    const filterBtn = page.getByRole('button', { name: /filtros/i }).first()
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
    }
  }
}
