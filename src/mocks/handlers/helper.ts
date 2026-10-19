import { HttpResponse } from 'msw'
import { mockDB } from '../db'

export function extractAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  // Token format: token-<userId>-<timestamp>
  if (token.startsWith('token-')) {
    const parts = token.split('-')
    const userId = `${parts[1]}-${parts[2]}-${parts[3]}`
    return mockDB.getUserById(userId)
  }

  // Fallback for default alice/bob tokens
  if (token === 'alice-token') return mockDB.getUserById('user-alice-01')
  if (token === 'bob-token') return mockDB.getUserById('user-bob-02')

  return null
}

export function requireAuth(request: Request) {
  const user = extractAuthUser(request)
  if (!user) {
    return {
      errorResponse: HttpResponse.json(
        { message: 'Sessão inválida ou expirada. Faça login novamente.', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
      user: null,
    }
  }
  return { errorResponse: null, user }
}

export function handleScenarioOverride(request: Request) {
  const scenario =
    request.headers.get('X-Mock-Scenario') ||
    mockDB.getScenario()

  if (scenario === '500_error') {
    return HttpResponse.json(
      { message: 'Erro interno simulado do servidor (500)', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
  if (scenario === '401_expired') {
    return HttpResponse.json(
      { message: 'Sua sessão expirou por inatividade.', code: 'SESSION_EXPIRED' },
      { status: 401 }
    )
  }
  return null
}
