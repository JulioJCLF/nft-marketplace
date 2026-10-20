import { test, expect } from '@playwright/test'
import { resetMockDatabase, loginAsAlice, waitForSocketConnection } from './helpers'
import type { Page } from '@playwright/test'

async function submitPendingOrder(page: Page) {
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
  await waitForSocketConnection(page)
  const scenarioResponse = await page.evaluate(async () => fetch('/api/system/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'order_pending' }),
  }).then((response) => response.json() as Promise<{ success: boolean }>))
  expect(scenarioResponse.success).toBe(true)
  await page.getByRole('button', { name: /confirmar pagamento em eth/i }).click()
  await expect(page.getByText('Pagamento enviado e aguardando confirmação da rede.')).toBeVisible()
  return page.evaluate(async () => {
    const token = localStorage.getItem('nft_auth_token')
    const response = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } })
    const { user } = await response.json() as { user: { id: string } }
    return { ...JSON.parse(localStorage.getItem(`kurio-pending-order:${user.id}`) || '{}') as { orderId: string }, userId: user.id }
  })
}

test.describe('6. Perfil, Carteiras e Eventos Socket.IO em Tempo Real', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
    await loginAsAlice(page)
  })

  test('deve salvar os campos completos do perfil e aceitar upload de avatar', async ({ page }) => {
    await page.goto('/profile?tab=profile')

    await page.getByLabel('Nome de usuário*').fill('alice-vance')
    await page.getByLabel('Apelido da carteira*').fill('Minha carteira')
    await page.getByLabel('Sufixo ENS do perfil').selectOption('eth')
    await page.getByLabel('Nome ENS do perfil').fill('alice-vance')
    await page.getByLabel('Enviar arquivo de avatar').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/xo8AAAAASUVORK5CYII=', 'base64'),
    })

    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Perfil atualizado com sucesso!')
    await page.reload()

    await expect(page.getByLabel('Nome de usuário*')).toHaveValue('alice-vance')
    await expect(page.getByLabel('Apelido da carteira*')).toHaveValue('Minha carteira')
    await expect(page.getByLabel('Nome ENS do perfil')).toHaveValue('alice-vance')
    await expect(page.getByRole('img', { name: 'Avatar de Alice Vance' })).toHaveAttribute('src', /^data:image\/png;base64,/)
  })

  test('deve cadastrar nova carteira e torná-la principal', async ({ page }) => {
    await page.goto('/profile?tab=wallets')

    const networkSelect = page.getByLabel('Rede da carteira principal')
    await expect(networkSelect).toHaveValue('mainnet')
    await networkSelect.selectOption('arbitrum')
    await expect(networkSelect).toHaveValue('arbitrum')
    await page.reload()
    await expect(page.getByLabel('Rede da carteira principal')).toHaveValue('arbitrum')

    await page.getByLabel('Código de indicação*').fill('KURIO-TESTE')
    await page.getByLabel('Nome ENS').fill('alice')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('status')).toHaveText('Dados da carteira salvos.')
    await page.reload()
    await expect(page.getByLabel('Código de indicação*')).toHaveValue('KURIO-TESTE')
    await expect(page.getByLabel('Nome ENS')).toHaveValue('alice')

    await page.getByRole('button', { name: /adicionar carteira/i }).click()
    await expect(page.getByText('Adicionar Nova Carteira')).toBeVisible()

    const addrInput = page.getByPlaceholder('0x...')
    await addrInput.fill('0x1234567890abcdef1234567890abcdef12345678')
    await page.getByRole('button', { name: /cadastrar carteira/i }).click()

    await expect(page.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeVisible()

    const secondaryCard = page.locator('[data-testid="wallet-card"]').filter({ hasText: '0x1234567890abcdef1234567890abcdef12345678' })
    await secondaryCard.getByRole('button', { name: 'Remover carteira' }).click()
    await expect(page.getByText('0x1234567890abcdef1234567890abcdef12345678')).not.toBeVisible()

    await page.getByRole('button', { name: /adicionar carteira/i }).click()
    await page.getByPlaceholder('0x...').fill('0x1234567890abcdef1234567890abcdef12345678')
    await page.getByRole('button', { name: /cadastrar carteira/i }).click()

    // Define as primary
    const card = page.locator('[data-testid="wallet-card"]').filter({ hasText: '0x1234567890abcdef1234567890abcdef12345678' })
    await card.getByRole('button', { name: /definir como principal/i }).click()

    await expect(page.getByLabel('Endereço da carteira*')).toHaveValue('0x1234567890abcdef1234567890abcdef12345678')
  })

  test('deve validar confirmação e senha atual ao tentar alterar a senha', async ({ page }) => {
    await page.goto('/profile?tab=profile')
    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('Password123!')
    await passwordFields.nth(1).fill('NovaSenha123!')
    await passwordFields.nth(2).fill('OutraSenha123!')
    await page.getByRole('button', { name: 'Salvar senha' }).click()
    await expect(page.getByRole('alert')).toHaveText('A nova senha e a confirmação não coincidem.')

    await passwordFields.nth(1).fill('NovaSenha123!')
    await passwordFields.nth(2).fill('NovaSenha123!')
    await passwordFields.nth(0).fill('senha-incorreta')
    await page.getByRole('button', { name: 'Salvar senha' }).click()
    await expect(page.getByRole('alert')).toContainText(/senha atual/i)
  })

  test('deve receber evento Socket.IO e bloquear checkout com cotação desatualizada', async ({ page }) => {
    // 1. User Alice has BAYC #7090 in cart and goes to /checkout
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /finalizar compra & pagamento/i })).toBeVisible()
    await expect(page.getByText('Bored Ape #7090')).toBeVisible()
    await waitForSocketConnection(page)
    const pong = await page.evaluate(async () => {
      const win = window as unknown as {
        __kurio_socket__?: {
          once: (evt: string, fn: (res: { timestamp: number }) => void) => void
          emit: (evt: string) => void
        }
      }
      const socket = win.__kurio_socket__ ?? (await import('/src/realtime/socket.ts')).socket
      return new Promise<{ timestamp: number }>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Socket.IO ping timed out')), 3000)
        socket.once('pong', (response: { timestamp: number }) => {
          window.clearTimeout(timeout)
          resolve(response)
        })
        socket.emit('ping')
      })
    })
    expect(pong.timestamp).toBeGreaterThan(0)

    // 2. Trigger the MSW endpoint in the app page; this emits a real Socket.IO event to the client.
    const updateResponse = await page.evaluate(async () => {
      const win = window as unknown as {
        __kurio_socket__?: {
          once: (evt: string, fn: (res: unknown) => void) => void
        }
      }
      const socket = win.__kurio_socket__ ?? (await import('/src/realtime/socket.ts')).socket
      const eventReceived = new Promise<unknown>((resolve) => {
        socket.once('nft.updated', resolve)
        window.setTimeout(() => resolve(null), 3000)
      })
      const response = await fetch('/api/system/trigger-nft-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'bored-ape-7090', price: '49.9000' }),
      })
      return { ok: response.ok, status: response.status, event: await eventReceived }
    })
    expect(updateResponse).toMatchObject({ ok: true, status: 200 })
    expect(updateResponse.event).not.toBeNull()
    expect((updateResponse.event as { availableSupply: number }).availableSupply).toBe(1)

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

  test('deve confirmar um pedido pendente pelo evento order.updated recebido via socket.io-client', async ({ page }) => {
    const pending = await submitPendingOrder(page)
    expect(pending.orderId).toBeTruthy()

    const result = await page.evaluate(async (orderId) => {
      const win = window as unknown as {
        __kurio_socket__?: {
          once: (evt: string, fn: (event: { id: string; version: number; orderId: string; userId: string; status: string }) => void) => void
        }
      }
      const socket = win.__kurio_socket__ ?? (await import('/src/realtime/socket.ts')).socket
      const received = new Promise<{ id: string; version: number; orderId: string; userId: string; status: string }>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('order.updated não recebido')), 4000)
        socket.once('order.updated', (event: { id: string; version: number; orderId: string; userId: string; status: string }) => {
          window.clearTimeout(timeout)
          resolve(event)
        })
      })
      const token = localStorage.getItem('nft_auth_token')
      const response = await fetch('/api/system/trigger-order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status: 'confirmed' }),
      })
      return { ok: response.ok, event: await received }
    }, pending.orderId)

    expect(result).toMatchObject({
      ok: true,
      event: { orderId: pending.orderId, userId: pending.userId, status: 'confirmed' },
    })
    await expect(page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })).toBeVisible()
    await expect(page.getByTestId('receipt-transaction-id')).toBeVisible()

    await page.getByRole('button', { name: 'Fechar confirmação e voltar ao marketplace' }).click()
    await page.getByRole('button', { name: 'Simulador de Cenários MSW' }).click()
    await page.getByRole('button', { name: /telemetria socket\.io/i }).click()
    await expect(page.getByText('order.updated', { exact: true })).toHaveCount(1)
    await page.evaluate(async ({ orderId, eventId, version }) => {
      const token = localStorage.getItem('nft_auth_token')
      const replay = (eventVersion: number, id: string, duplicate: boolean) => fetch('/api/system/replay-order-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, version: eventVersion, eventId: id, duplicate }),
      })
      await replay(version, eventId, true)
      await replay(version - 1, `stale-${eventId}`, false)
    }, { orderId: pending.orderId, eventId: result.event.id, version: result.event.version })
    await expect(page.getByText('order.updated', { exact: true })).toHaveCount(1)
    await expect(page.getByText(new RegExp(`Versão: v${result.event.version}`))).toBeVisible()
  })

  test('deve reconciliar a confirmação pendente após desconexão e recarregamento', async ({ page }) => {
    const pending = await submitPendingOrder(page)
    const updated = await page.evaluate(async (orderId) => {
      const win = window as unknown as {
        __kurio_socket__?: {
          disconnect: () => void
        }
      }
      const socket = win.__kurio_socket__ ?? (await import('/src/realtime/socket.ts')).socket
      socket.disconnect()
      const token = localStorage.getItem('nft_auth_token')
      const response = await fetch('/api/system/trigger-order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status: 'confirmed' }),
      })
      return { ok: response.ok, body: await response.json() as { order: { status: string } } }
    }, pending.orderId)
    expect(updated).toMatchObject({ ok: true, body: { order: { status: 'confirmed' } } })

    await page.reload()
    await expect(page.getByRole('heading', { name: /seus nfts agora estão na sua carteira/i })).toBeVisible()
    await expect(page.getByTestId('receipt-transaction-id')).toBeVisible()
  })

  test('deve encerrar pagamento pendente como recusado, manter o carrinho e liberar estoque', async ({ page }) => {
    const pending = await submitPendingOrder(page)
    const result = await page.evaluate(async (orderId) => {
      const win = window as unknown as {
        __kurio_socket__?: {
          once: (evt: string, fn: (event: { orderId: string; status: string }) => void) => void
        }
      }
      const socket = win.__kurio_socket__ ?? (await import('/src/realtime/socket.ts')).socket
      const received = new Promise<{ orderId: string; status: string }>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('order.updated não recebido')), 4000)
        socket.once('order.updated', (event: { orderId: string; status: string }) => {
          window.clearTimeout(timeout)
          resolve(event)
        })
      })
      const token = localStorage.getItem('nft_auth_token')
      const response = await fetch('/api/system/trigger-order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status: 'failed' }),
      })
      return { ok: response.ok, event: await received }
    }, pending.orderId)

    expect(result).toMatchObject({ ok: true, event: { orderId: pending.orderId, status: 'failed' } })
    await expect(page.getByText('O pagamento foi recusado. Seus itens continuam no carrinho.')).toBeVisible()
    await expect(page.getByText('Bored Ape #7090')).toBeVisible()
  })
})
