import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from '../e2e/helpers'

test.describe('Regressão Visual do Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('snapshot visual da página inicial e catálogo', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('home-desktop.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('snapshot visual da página de detalhes do NFT', async ({ page }) => {
    await page.goto('/nft/bored-ape-7090')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('detail-desktop.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('snapshot visual do carrinho aberto', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /abrir carrinho/i }).click()
    await page.waitForTimeout(400)
    await expect(page).toHaveScreenshot('cart-drawer-desktop.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('snapshot visual da página de checkout e pagamento', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('checkout-desktop.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })
})
