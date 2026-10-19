import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { extractAuthUser, handleScenarioOverride } from './helper'

export const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as { email?: string; password?: string }
    const { email, password } = body

    if (!email || !password) {
      return HttpResponse.json(
        { message: 'E-mail e senha são obrigatórios.', code: 'INVALID_CREDENTIALS' },
        { status: 400 }
      )
    }

    const user = mockDB.getUserByEmail(email)
    if (!user) {
      return HttpResponse.json(
        { message: 'E-mail ou senha inválidos.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // In simulated backend, 'Password123!' is the default for Alice and Bob
    if (password !== 'Password123!' && !user.passwordHash.includes(password)) {
      return HttpResponse.json(
        { message: 'E-mail ou senha inválidos.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    const token = `token-${user.id}-${Date.now()}`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...cleanUser } = user

    // Merge guest cart items into authenticated user cart
    mockDB.mergeGuestCartIntoUser(cleanUser.id)

    return HttpResponse.json({
      token,
      user: cleanUser,
    })
  }),

  // POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as { name?: string; email?: string; password?: string }
    const { name, email, password } = body

    if (!name || !email || !password) {
      return HttpResponse.json(
        { message: 'Nome, e-mail e senha são obrigatórios.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return HttpResponse.json(
        { message: 'A senha deve ter pelo menos 6 caracteres.', code: 'WEAK_PASSWORD' },
        { status: 400 }
      )
    }

    const existing = mockDB.getUserByEmail(email)
    if (existing) {
      return HttpResponse.json(
        { message: 'Este endereço de e-mail já está cadastrado.', code: 'EMAIL_CONFLICT' },
        { status: 409 }
      )
    }

    const cleanUser = mockDB.createUser(name, email, `hash-${password}`)
    const token = `token-${cleanUser.id}-${Date.now()}`

    // Assign default mock wallet to new user
    mockDB.addWallet(cleanUser.id, {
      address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      provider: 'metamask',
      network: 'mainnet',
      isPrimary: true,
      balanceEth: '10.0000',
    })

    // Merge any items accumulated in guest cart
    mockDB.mergeGuestCartIntoUser(cleanUser.id)

    return HttpResponse.json({ token, user: cleanUser }, { status: 201 })
  }),

  // GET /api/auth/session
  http.get('/api/auth/session', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const user = extractAuthUser(request)
    if (!user) {
      return HttpResponse.json(
        { message: 'Sessão não encontrada ou expirada.', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    return HttpResponse.json({ user })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true, message: 'Sessão encerrada com sucesso.' })
  }),
]
