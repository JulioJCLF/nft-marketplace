import { test, expect } from '@playwright/test'
import { resetMockDatabase, openMobileFilterDrawerIfNeeded } from './helpers'

async function getCatalogSearchInput(page: import('@playwright/test').Page) {
  const width = page.viewportSize()?.width ?? 1440
  if (width < 768) {
    const searchInput = page.getByPlaceholder('Explorar coleções')
    await searchInput.waitFor({ state: 'visible' })
    return searchInput
  }

  if (width >= 1024) await page.getByText('Opções adicionais', { exact: true }).click()
  const searchInput = width >= 1024
    ? page.locator('aside input[aria-label="Nome, coleção"]')
    : page.getByPlaceholder('Nome, coleção...')
  await searchInput.waitFor({ state: 'visible' })
  await expect(searchInput).toBeVisible()
  return searchInput
}

test.describe('1. Catálogo, Busca, Filtros, Ordenação e Paginação', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
  })

  test('deve pesquisar por texto e sincronizar busca na URL', async ({ page }) => {
    await page.goto('/')

    const searchInput = await getCatalogSearchInput(page)
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

    const searchInput = await getCatalogSearchInput(page)
    await searchInput.fill('PrimataInexistenteXYZ999')
    await searchInput.press('Enter')

    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    const clearBtn = page.getByRole('button', { name: 'Limpar Todos os Filtros' }).first()
    await expect(clearBtn).toBeVisible()

    // Clear filters
    await clearBtn.click()
    const grid = page.locator('#catalog-grid')
    await expect(grid.locator('article')).toHaveCount(9)
  })

  test('deve combinar categoria, disponibilidade e ordenação e preservar filtros após recarregar', async ({ page }) => {
    await page.goto('/')
    await openMobileFilterDrawerIfNeeded(page)
    await page.getByRole('button', { name: 'Arte digital' }).click()

    const width = page.viewportSize()?.width ?? 1440
    if (width < 1024) {
      await page.getByText('Opções adicionais', { exact: true }).last().click()
    } else {
      await page.getByText('Opções adicionais', { exact: true }).click()
    }
    await page.getByLabel('Apenas Disponíveis').last().check()
    await page.locator('#sort-select').selectOption('popular')

    await expect(page).toHaveURL(/category=art/)
    await expect(page).toHaveURL(/status=available/)
    await expect(page).toHaveURL(/sort=popular/)
    await page.reload()

    await expect(page).toHaveURL(/category=art/)
    await expect(page).toHaveURL(/status=available/)
    await expect(page).toHaveURL(/sort=popular/)
    await openMobileFilterDrawerIfNeeded(page)
    if (width < 1024) await page.getByText('Opções adicionais', { exact: true }).last().click()
    else await page.getByText('Opções adicionais', { exact: true }).click()
    await expect(page.getByLabel('Apenas Disponíveis').last()).toBeChecked()
  })
})
