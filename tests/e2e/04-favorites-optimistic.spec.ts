import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from './helpers'

test.describe('4. Favoritos, Atualização Otimista e Rollback em Falha', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('deve atualizar favoritos de forma otimista e persistir no servidor', async ({ page }) => {
    await page.goto('/')

    // Find card for Bored Ape #8817 (not initially favorited by Alice)
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    const favButton = card.getByLabel(/adicionar aos favoritos/i)

    // Initial count is 980
    await expect(card.getByText('980')).toBeVisible()

    // Click favorite
    await favButton.click()

    // Optimistically increments to 981
    await expect(card.getByText('981')).toBeVisible()

    // Reload page to verify persistence
    await page.reload()
    const cardAfter = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await expect(cardAfter.getByText('981')).toBeVisible()
  })

  test('deve reverter (rollback) o estado otimista quando o servidor retornar erro 500', async ({ page }) => {
    await page.goto('/')

    // Activate error scenario in scenario bar
    await page.getByRole('button', { name: /simulador de cenários/i }).click()
    const select = page.locator('#scenario-select')
    await select.selectOption('favorite_fail')

    // Find card for Bored Ape #8817 (980 likes)
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    const favButton = card.getByLabel(/adicionar aos favoritos/i)

    await favButton.click()

    // Rollback ensures it returns to 980
    await expect(card.getByText('980')).toBeVisible()
  })
})
