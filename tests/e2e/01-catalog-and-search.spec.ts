import { test, expect } from '@playwright/test'
import { resetMockDatabase, openMobileFilterDrawerIfNeeded } from './helpers'

test.describe('1. Catálogo, Busca, Filtros, Ordenação e Paginação', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
  })

  test('deve pesquisar por texto e sincronizar busca na URL', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.locator('input[placeholder*="Nome, coleção"]:visible').first()
    await searchInput.fill('CyberKong')
    await searchInput.press('Enter')

    await expect(page).toHaveURL(/search=CyberKong/)
    const grid = page.locator('#catalog-grid')
    await expect(grid.getByText('CyberKong #124')).toBeVisible()
    await expect(grid.getByText('Bored Ape #7090')).not.toBeVisible()
  })

  test('deve filtrar por categoria e atualizar contagem', async ({ page }) => {
    await page.goto('/')

    await openMobileFilterDrawerIfNeeded(page)
    await page.getByRole('button', { name: 'Colecionáveis' }).click()
    await expect(page).toHaveURL(/category=collectibles/)

    const grid = page.locator('#catalog-grid')
    await expect(grid.getByText('Bored Ape #8817')).toBeVisible()
  })

  test('deve ordenar por menor preço e refletir na URL', async ({ page }) => {
    await page.goto('/')

    const sortSelect = page.locator('#sort-select')
    await sortSelect.selectOption('price_asc')

    await expect(page).toHaveURL(/sort=price_asc/)
    const grid = page.locator('#catalog-grid')
    // Solarpunk Ape #505 is 8.9000 ETH
    await expect(grid.getByText('Solarpunk Ape #505')).toBeVisible()
  })

  test('deve navegar pelas páginas e preservar histórico do navegador', async ({ page }) => {
    await page.goto('/')

    // Check page 1 is active
    await expect(page.getByRole('button', { name: '1' })).toBeVisible()

    // Click page 2
    await page.getByRole('button', { name: '2' }).click()
    await expect(page).toHaveURL(/page=2/)

    // Browser back button
    await page.goBack()
    await expect(page).toHaveURL(/(page=1|\/)/)
  })

  test('deve exibir estado vazio quando nenhum resultado for encontrado', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.locator('input[placeholder*="Nome, coleção"]:visible').first()
    await searchInput.fill('PrimataInexistenteXYZ999')
    await searchInput.press('Enter')

    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    const clearBtn = page.getByRole('button', { name: 'Limpar Todos os Filtros' }).first()
    await expect(clearBtn).toBeVisible()

    // Clear filters
    await clearBtn.click()
    const grid = page.locator('#catalog-grid')
    await expect(grid.locator('article')).toHaveCount(6)
  })
})
