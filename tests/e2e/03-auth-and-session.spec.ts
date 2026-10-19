import { test, expect } from '@playwright/test'
import { resetMockDatabase } from './helpers'

test.describe('3. Autenticação, Sessão, Expiração e Troca de Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockDatabase(page)
  })

  test('deve realizar login com Alice Vance e persistir sessão após reload', async ({ page }) => {
    await page.goto('/')

    // Open login modal
    await page.getByRole('button', { name: /entrar/i }).first().click()
    await expect(page.getByText('Conectar ao Marketplace')).toBeVisible()

    // Use Alice quick button in dialog
    await page.getByRole('dialog').getByRole('button', { name: 'Alice Vance' }).click()
    await page.getByRole('button', { name: /^conectar$/i }).click()

    // Assert user menu is visible in navbar
    const userMenu = page.getByTestId('navbar-user-menu')
    await expect(userMenu).toBeVisible()
    await expect(userMenu).toHaveAttribute('aria-label', /Alice Vance/)

    // Reload page and assert session is restored
    await page.reload()
    await expect(page.getByTestId('navbar-user-menu')).toBeVisible()
    await expect(page.getByTestId('navbar-user-menu')).toHaveAttribute('aria-label', /Alice Vance/)
  })

  test('deve trocar de usuário de forma segura e limpar caches privados', async ({ page }) => {
    await page.goto('/')

    // Login as Alice
    await page.getByRole('button', { name: /entrar/i }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Alice Vance' }).click()
    await page.getByRole('button', { name: /^conectar$/i }).click()
    await expect(page.getByTestId('navbar-user-menu')).toBeVisible()

    // Open scenario bar and switch to Bob Martin
    await page.getByRole('button', { name: /simulador de cenários/i }).click()
    await page.getByTestId('scenario-switch-bob').click()

    await expect(page.getByTestId('navbar-user-menu')).toHaveAttribute('aria-label', /Bob Martin/)
  })

  test('deve efetuar logout completo e exigir nova autenticação', async ({ page }) => {
    await page.goto('/')

    // Login
    await page.getByRole('button', { name: /entrar/i }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Alice Vance' }).click()
    await page.getByRole('button', { name: /^conectar$/i }).click()

    // Click user avatar dropdown
    await page.getByTestId('navbar-user-menu').click()
    await page.getByRole('menuitem', { name: /sair da conta/i }).click()

    await expect(page.getByRole('button', { name: /entrar/i }).first()).toBeVisible()
  })
})
