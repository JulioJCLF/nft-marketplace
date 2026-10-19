import { test, expect } from '@playwright/test'
import { resetMockDatabase } from './helpers'

test.describe('2. Detalhes da Obra e Recursos Inexistentes (404)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
  })

  test('deve abrir a página de detalhes com metadados completos e histórico', async ({ page }) => {
    await page.goto('/')

    // Click on Bored Ape #7090 card title
    await page.getByRole('link', { name: 'Bored Ape #7090' }).first().click()

    await expect(page).toHaveURL(/\/nft\/bored-ape-7090/)
    await expect(page.getByRole('heading', { name: 'Bored Ape #7090' })).toBeVisible()
    await expect(page.getByText('Bored Ape Yacht Club').first()).toBeVisible()
    await expect(page.getByText('45.5000 ETH')).toBeVisible()

    // Check traits tab
    await expect(page.getByText('Green Letterman Jacket')).toBeVisible()

    // Check details tab
    await page.getByRole('button', { name: /descrição & detalhes/i }).click()
    await expect(page.getByText('ERC-721')).toBeVisible()

    // Check history tab
    await page.getByRole('button', { name: /histórico/i }).click()
    await expect(page.getByText('42.0000 ETH')).toBeVisible()
  })

  test('deve tratar NFT inexistente com tela 404 e botão de retorno', async ({ page }) => {
    await page.goto('/nft/primata-fantasma-inexistente')

    await expect(page.getByText('NFT Não Encontrado (404)')).toBeVisible()
    const backBtn = page.getByRole('button', { name: /voltar ao catálogo principal/i })
    await expect(backBtn).toBeVisible()

    await backBtn.click()
    await expect(page).toHaveURL(/\/$|\/\?/)
  })
})
