import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from './helpers'

test.describe('5. Carrinho, Cupons, Idempotência e Confirmação de Pedido', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('deve manipular itens no carrinho, aplicar cupom DESC10 e finalizar com recibo imutável', async ({ page }) => {
    await page.goto('/')

    // Add Bored Ape #8817 to cart
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await card.getByRole('button', { name: /comprar/i }).click()

    // Assert cart drawer opened
    await expect(page.getByRole('heading', { name: /carrinho/i })).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Bored Ape #8817')).toBeVisible()

    // Apply coupon DESC10
    const couponInput = page.getByPlaceholder(/cupom \(ex: desc10\)/i)
    await couponInput.fill('DESC10')
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click()

    await expect(page.getByText(/10% de desconto/i)).toBeVisible()

    // Proceed to checkout
    await page.getByRole('button', { name: /finalizar compra/i }).click()
    await expect(page).toHaveURL('/checkout')

    // On Checkout page, select Network Polygon
    await page.getByRole('button', { name: /polygon/i }).click()

    // Confirm Payment
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()

    // Assert Order Confirmed screen and receipt
    await expect(page.getByRole('heading', { name: /pedido confirmado com sucesso/i })).toBeVisible()
    await expect(page.getByText('Hash da Transação (TX):')).toBeVisible()
    await expect(page.getByText('POLYGON')).toBeVisible()
  })

  test('deve tratar recusa de pagamento mantendo os itens no carrinho', async ({ page }) => {
    await page.goto('/')

    // Add Bored Ape #8817 to cart
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await card.getByRole('button', { name: /comprar/i }).click()
    await page.getByRole('button', { name: /finalizar compra/i }).click()
    await expect(page).toHaveURL('/checkout')

    // Check simulate failure checkbox
    const failCheckbox = page.locator('input[type="checkbox"]').first()
    await failCheckbox.check()

    // Confirm Payment
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()

    // Assert error message
    await expect(page.getByText(/transação recusada pela carteira/i)).toBeVisible()

    // Assert cart items are still intact
    await expect(page.getByText(/revisão do pedido/i)).toBeVisible()
    await expect(page.getByText('Bored Ape #8817')).toBeVisible()
  })
})
