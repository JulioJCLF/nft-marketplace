import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice } from './helpers'

test.describe('5. Carrinho, Cupons, Idempotência e Confirmação de Pedido', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('deve manipular itens no carrinho, aplicar cupom DESC10 e finalizar com recibo imutável', async ({ page }) => {
    await page.goto('/')

    // Navega para os detalhes do Bored Ape #8817 através do link no card
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await card.getByRole('link', { name: 'Bored Ape #8817', exact: true }).click()
    await expect(page).toHaveURL(/\/nft\/bored-ape-8817/)

    // Na página de detalhes, realiza a compra
    await page.getByRole('button', { name: /comprar/i }).click()

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
    await page.locator('select[aria-label="Rede"]:visible').selectOption('polygon')

    // Confirm Payment
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()

    // Assert Order Confirmed screen and receipt
    await expect(page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })).toBeVisible()
    await expect(page.getByText('ID da transação')).toBeVisible()
    await expect(page.getByTestId('receipt-transaction-id')).toHaveText(/^0x[A-F\d]{4}\.\.\.[A-F\d]{4}$/)
    await expect(page.getByText('POLYGON')).toBeVisible()
  })

  test('deve tratar recusa de pagamento mantendo os itens no carrinho', async ({ page }) => {
    await page.goto('/')

    // Navega para os detalhes do Bored Ape #8817 através do link no card
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await card.getByRole('link', { name: 'Bored Ape #8817', exact: true }).click()
    await expect(page).toHaveURL(/\/nft\/bored-ape-8817/)

    // Na página de detalhes, realiza a compra
    await page.getByRole('button', { name: /comprar/i }).click()
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

  test('deve recuperar pedido criado após resposta 504 sem criar outra compra e persistir o recibo no refresh', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('#catalog-grid article').filter({ hasText: 'Bored Ape #8817' })
    await card.getByRole('link', { name: 'Bored Ape #8817', exact: true }).click()
    await page.getByRole('button', { name: /comprar/i }).click()
    await page.getByRole('button', { name: /finalizar compra/i }).click()
    await expect(page).toHaveURL('/checkout')

    await page.evaluate(async () => {
      await fetch('/api/system/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'order_timeout' }),
      })
    })
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()

    const confirmation = page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })
    await expect(confirmation).toBeVisible({ timeout: 15000 })
    const transactionId = await page.getByTestId('receipt-transaction-id').textContent()

    await page.reload()
    await expect(page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })).toBeVisible()
    await expect(page.getByTestId('receipt-transaction-id')).toHaveText(transactionId || '')
    const orderCount = await page.evaluate(async () => {
      const token = localStorage.getItem('nft_auth_token')
      const response = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      return (await response.json()).total as number
    })
    expect(orderCount).toBe(1)
  })

  test('deve exibir erros para cupom inexistente e expirado', async ({ page }) => {
    await page.goto('/nft/bored-ape-8817')
    await page.getByRole('button', { name: /comprar/i }).click()
    const couponInput = page.getByPlaceholder(/cupom \(ex: desc10\)/i)
    await couponInput.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
    await expect(page.getByText(/inválido ou inexistente/i)).toBeVisible()

    await couponInput.fill('EXPIRADO')
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
    await expect(page.getByText(/cupom de desconto expirou/i)).toBeVisible()
  })

  test('deve rejeitar reutilização da chave de idempotência com dados divergentes', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
    const result = await page.evaluate(async () => {
      const win = window as unknown as { __kurio_api__?: { post: (url: string, data: unknown) => Promise<{ status: number }> } }
      const api = win.__kurio_api__ ?? (await import('/src/lib/api.ts')).api
      const payload = {
        idempotencyKey: `e2e-conflict-${Date.now()}`,
        items: [{ nftId: 'bored-ape-7090', quantity: 1 }],
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        network: 'mainnet',
        acceptedQuoteId: 'quote-e2e-idempotency',
      }
      const first = await api.post('/orders', payload)
      let secondStatus = 0
      let secondBody = ''
      try {
        await api.post('/orders', { ...payload, walletAddress: '0x1234567890123456789012345678901234567890' })
      } catch (error) {
        const apiError = error as { status?: number; code?: string; message?: string }
        secondStatus = apiError.status ?? 0
        secondBody = apiError.code ?? apiError.message ?? ''
      }
      return { firstStatus: first.status, secondStatus, secondBody }
    })
    expect(result).toMatchObject({ firstStatus: 201, secondStatus: 409 })
    expect(result.secondBody).toContain('IDEMPOTENCY_CONFLICT')
  })

  test('deve abrir autenticação quando a sessão expirar durante o checkout sem perder o carrinho', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
    await page.evaluate(async () => {
      await fetch('/api/system/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: '401_expired' }) })
    })
    await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Conectar ao Marketplace' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('nft_auth_token'))).toBeNull()
    const retainedCart = await page.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('nft_mock_db_v2') || '{}') as { carts?: Record<string, Array<{ nftId: string }>> }
      return db.carts?.['user-alice-01']?.map((item) => item.nftId) ?? []
    })
    expect(retainedCart).toContain('bored-ape-7090')
  })
})
