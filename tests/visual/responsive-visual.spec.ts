import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from '../e2e/helpers'

test.describe('Regressão visual responsiva — mobile e Full HD', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  async function expectResponsiveScreenshot(page: import('@playwright/test').Page, name: string) {
    // Full-page screenshots do not scroll the viewport. Reveal viewport-deferred sections and
    // native lazy images first so the baseline represents the complete page the user can reach.
    const pathname = new URL(page.url()).pathname
    if (pathname === '/' || pathname.startsWith('/nft/')) {
      await page.evaluate(async () => {
        let previousHeight = 0
        let stableRounds = 0
        for (let round = 0; round < 6 && stableRounds < 2; round += 1) {
          const height = document.documentElement.scrollHeight
          for (let y = 0; y < height; y += Math.max(1, Math.floor(window.innerHeight * 0.9))) {
            window.scrollTo(0, y)
            await new Promise((resolve) => window.setTimeout(resolve, 40))
          }
          window.scrollTo(0, document.documentElement.scrollHeight)
          await new Promise((resolve) => window.setTimeout(resolve, 100))
          const nextHeight = document.documentElement.scrollHeight
          stableRounds = nextHeight === previousHeight ? stableRounds + 1 : 0
          previousHeight = nextHeight
        }
        window.scrollTo(0, 0)
      })
    }
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(hasHorizontalOverflow, 'A tela não deve ter overflow horizontal neste viewport').toBe(false)
    await expect(page).toHaveScreenshot(name, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  }

  test('início e catálogo sem overflow horizontal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expectResponsiveScreenshot(page, 'responsive-home.png')
  })

  test('detalhe de NFT sem overflow horizontal', async ({ page }) => {
    await page.goto('/nft/bored-ape-7090')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Bored Ape #7090' })).toBeVisible()
    await expectResponsiveScreenshot(page, 'responsive-detail.png')
  })

  test('carrinho completo sem overflow horizontal', async ({ page }) => {
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')
    if ((page.viewportSize()?.width ?? 0) < 768) {
      await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
    } else {
      await expect(page.getByText('Carrinho NFTs', { exact: true })).toBeVisible()
    }
    await expectResponsiveScreenshot(page, 'responsive-cart.png')
  })

  test('checkout sem overflow horizontal', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
    await expectResponsiveScreenshot(page, 'responsive-checkout.png')
  })

  test('perfil do colecionador sem overflow horizontal', async ({ page }) => {
    await page.goto('/profile?tab=profile')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expectResponsiveScreenshot(page, 'responsive-profile.png')
  })

  test('carteiras sem overflow horizontal', async ({ page }) => {
    await page.goto('/profile?tab=wallets')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
    await expectResponsiveScreenshot(page, 'responsive-wallets.png')
  })

  test('recibo confirmado sem overflow horizontal', async ({ page }) => {
    await page.goto('/nft/bored-ape-8817')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /comprar/i }).click()
    await page.getByRole('button', { name: /finalizar compra/i }).click()
    await expect(page).toHaveURL('/checkout')
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()
    await expect(page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })).toBeVisible()
    await expectResponsiveScreenshot(page, 'responsive-receipt.png')
  })
})
