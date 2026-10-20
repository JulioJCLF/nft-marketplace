import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { requireAuth, handleScenarioOverride } from './helper'
import { WalletProvider, NetworkId, Wallet } from '@/types'

export const profileHandlers = [
  // GET /api/profile
  http.get('/api/profile', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    return HttpResponse.json({ user })
  }),

  // PUT /api/profile
  http.put('/api/profile', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as {
      name?: string
      username?: string
      email?: string
      avatar?: string
      walletAlias?: string
      ensName?: string
      ensSuffix?: string
    }
    const updated = mockDB.updateUser(user.id, body)

    return HttpResponse.json({ user: updated, message: 'Perfil atualizado com sucesso!' })
  }),

  // PUT /api/profile/password
  http.put('/api/profile/password', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return HttpResponse.json(
        { message: 'Senha atual e nova senha são obrigatórias.', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return HttpResponse.json(
        { message: 'A nova senha deve ter pelo menos 6 caracteres.', code: 'WEAK_PASSWORD' },
        { status: 400 }
      )
    }

    // Alice/Bob standard password hash check
    const isAliceBob = currentPassword === 'Password123!'
    const success = isAliceBob
      ? mockDB.updatePassword(user.id, 'e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878e4e19398b23bd38ec221a', `hash-${newPassword}`)
      : mockDB.updatePassword(user.id, `hash-${currentPassword}`, `hash-${newPassword}`)

    if (!success) {
      return HttpResponse.json(
        { message: 'A senha atual informada está incorreta.', code: 'INVALID_CURRENT_PASSWORD' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ success: true, message: 'Senha alterada com sucesso!' })
  }),

  // GET /api/wallets
  http.get('/api/wallets', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const wallets = mockDB.getWallets(user.id)
    return HttpResponse.json({ items: wallets, total: wallets.length })
  }),

  // POST /api/wallets
  http.post('/api/wallets', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as {
      address?: string
      provider?: WalletProvider
      network?: NetworkId
      isPrimary?: boolean
    }

    const { address, provider = 'metamask', network = 'mainnet', isPrimary = false } = body

    if (!address || !address.trim()) {
      return HttpResponse.json(
        { message: 'Endereço da carteira é obrigatório.', code: 'MISSING_ADDRESS' },
        { status: 400 }
      )
    }

    // Validate Ethereum address format (0x + 40 hex chars or shortened representation)
    const cleanAddr = address.trim()
    if (!cleanAddr.startsWith('0x') || cleanAddr.length < 10) {
      return HttpResponse.json(
        { message: 'Endereço de carteira Ethereum inválido. Deve começar com 0x.', code: 'INVALID_ADDRESS' },
        { status: 400 }
      )
    }

    const newWallet = mockDB.addWallet(user.id, {
      address: cleanAddr,
      provider,
      network,
      isPrimary,
      balanceEth: '15.5000',
    })

    return HttpResponse.json(newWallet, { status: 201 })
  }),

  // PUT /api/wallets/:id/primary
  http.put('/api/wallets/:id/primary', ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const success = mockDB.setPrimaryWallet(user.id, id)

    if (!success) {
      return HttpResponse.json(
        { message: 'Carteira não encontrada.', code: 'WALLET_NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ success: true, message: 'Carteira principal definida com sucesso.' })
  }),

  // PUT /api/wallets/:id/network
  http.put('/api/wallets/:id/network', async ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const body = (await request.json()) as { network?: NetworkId }
    const networks: NetworkId[] = ['mainnet', 'sepolia', 'arbitrum', 'polygon']

    if (!body.network || !networks.includes(body.network)) {
      return HttpResponse.json(
        { message: 'Rede inválida.', code: 'INVALID_NETWORK' },
        { status: 400 }
      )
    }

    const success = mockDB.updateWalletNetwork(user.id, id, body.network)
    if (!success) {
      return HttpResponse.json(
        { message: 'Carteira não encontrada.', code: 'WALLET_NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ success: true, message: 'Rede da carteira atualizada com sucesso.' })
  }),

  // PUT /api/wallets/:id/profile
  http.put('/api/wallets/:id/profile', async ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const body = (await request.json()) as Pick<Wallet, 'walletAlias' | 'profileName' | 'ensOrSecondary' | 'referralCode' | 'ensName' | 'ensSuffix'>
    const success = mockDB.updateWalletProfile(user.id, id, body)

    if (!success) {
      return HttpResponse.json(
        { message: 'Carteira não encontrada.', code: 'WALLET_NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ success: true, message: 'Dados da carteira atualizados com sucesso.' })
  }),

  // DELETE /api/wallets/:id
  http.delete('/api/wallets/:id', ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const success = mockDB.removeWallet(user.id, id)

    if (!success) {
      return HttpResponse.json(
        { message: 'Carteira não encontrada.', code: 'WALLET_NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ success: true, message: 'Carteira removida com sucesso.' })
  }),
]
