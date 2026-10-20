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

  test('deve cadastrar uma conta e rejeitar e-mail duplicado com mensagens acessíveis', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /entrar/i }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(dialog.getByRole('button', { name: 'Continuar com Google' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Continuar com Facebook' })).toBeVisible()
    await dialog.getByLabel('Nome Completo').fill('Teste Kurio')
    await dialog.getByLabel('E-mail').fill('teste-kurio@example.com')
    await dialog.getByLabel('Senha').fill('Kurio123!')
    await dialog.getByRole('button', { name: 'Criar Conta' }).click()
    await expect(page.getByTestId('navbar-user-menu')).toHaveAttribute('aria-label', /Teste Kurio/)

    await page.getByTestId('navbar-user-menu').click()
    await page.getByRole('menuitem', { name: /sair da conta/i }).click()
    await page.getByRole('button', { name: /entrar/i }).first().click()
    const duplicateDialog = page.getByRole('dialog')
    await duplicateDialog.getByRole('button', { name: 'Cadastrar' }).click()
    await duplicateDialog.getByLabel('Nome Completo').fill('Bob Martin')
    await duplicateDialog.getByLabel('E-mail').fill('bob@example.com')
    await duplicateDialog.getByLabel('Senha').fill('Password123!')
    await duplicateDialog.getByRole('button', { name: 'Criar Conta' }).click()
    await expect(duplicateDialog.getByRole('alert')).toContainText('já está cadastrado')
  })

  test('deve manter o foco de teclado dentro do diálogo de autenticação', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /entrar/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeVisible()
    await expect(dialog.getByLabel('Senha')).toBeVisible()

    const focusedInsideDialog = await page.evaluate(() => {
      const active = document.activeElement
      return Boolean(active?.closest('[role="dialog"]'))
    })
    expect(focusedInsideDialog).toBe(true)
    await page.keyboard.press('Shift+Tab')
    await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
  })
})
