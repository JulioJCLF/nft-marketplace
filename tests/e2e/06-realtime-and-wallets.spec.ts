import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from './helpers'

test.describe('6. Perfil, Carteiras e Eventos Socket.IO em Tempo Real', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('deve cadastrar nova carteira e torná-la principal', async ({ page }) => {
    await page.goto('/profile?tab=wallets')

    await page.getByRole('button', { name: /adicionar carteira/i }).click()
    await expect(page.getByText('Adicionar Nova Carteira')).toBeVisible()

    const addrInput = page.getByPlaceholder('0x...')
    await addrInput.fill('0x1234567890abcdef1234567890abcdef12345678')
    await page.getByRole('button', { name: /cadastrar carteira/i }).click()

    await expect(page.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeVisible()

    // Define as primary
    const card = page.locator('[data-testid="wallet-card"]').filter({ hasText: '0x1234567890abcdef1234567890abcdef12345678' })
    await card.getByRole('button', { name: /definir como principal/i }).click()

    await expect(card.getByText('Principal')).toBeVisible()
  })

  test('deve receber evento Socket.IO e bloquear checkout com cotação desatualizada', async ({ page }) => {
    // 1. User Alice has BAYC #7090 in cart and goes to /checkout
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
    await expect(page.getByText('Bored Ape #7090')).toBeVisible()

    // 2. Real-time event triggered: price of BAYC #7090 changed to 49.9000 ETH
    await page.getByRole('button', { name: /simulador de cenários/i }).click()
    await page.getByRole('button', { name: /aumentar preço bayc #7090/i }).click()

    // 3. UI warns that real-time price change occurred and blocks confirmation
    await expect(page.getByText(/alteração em tempo real detectada durante o checkout/i)).toBeVisible()

    // Confirm button should be blocked until review
    const confirmBtn = page.getByRole('button', { name: /confirmar pagamento em eth/i })
    await expect(confirmBtn).toBeDisabled()

    // 4. Click Review and Accept New Quote
    await page.getByRole('button', { name: /revisar e aceitar nova cotação/i }).click()

    // Now confirm button is unlocked
    await expect(confirmBtn).toBeEnabled()
  })
})
