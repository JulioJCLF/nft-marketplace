import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { NFTUpdatedEvent, OrderUpdatedEvent } from '@/types'

// Active simulated Socket.IO connections. Only emit through the MSW binding so
// browser consumers must receive events through socket.io-client.
interface SocketServerClient {
  emit: (event: string, ...args: unknown[]) => void
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

const activeSocketClients = new Set<SocketServerClient>()

// Define the MSW WebSocket handler for Socket.IO
// Matching any origin connecting to /socket.io
// @mswjs/socket.io-binding normalizes the default `/socket.io/` path to the
// websocket origin before matching. Match that normalized URL; non-Socket.IO
// websockets (e.g. Vite HMR) are explicitly passed through below.
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const socketOrigin = typeof window === 'undefined'
  ? 'ws://localhost:3000'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
const escapedSocketOrigin = escapeRegExp(socketOrigin)
const socketIoUrl = new RegExp(`^(?:${escapedSocketOrigin}/socket\\.io/?|${escapedSocketOrigin}/?)$`)
export const socketIoEndpoint = ws.link(socketIoUrl)

export const socketHandler = socketIoEndpoint.addEventListener('connection', (connection) => {
  // The normalized Socket.IO matcher also sees same-origin root websockets.
  // Preserve those unrelated connections instead of mocking them.
  if (!connection.client.url.pathname.includes('/socket.io/')) {
    connection.server.connect()
    return
  }
  try {
    const { client } = toSocketIo(connection)
    activeSocketClients.add(client)

    // Listen for client ping / test events
    client.on('ping', () => {
      client.emit('pong', { timestamp: Date.now() })
    })

    client.on('subscribe', (channel: unknown) => {
      client.emit('subscribed', { channel, timestamp: Date.now() })
    })

    connection.client.addEventListener('close', () => {
      activeSocketClients.delete(client)
    })
  } catch (err) {
    console.warn('[MSW Socket.IO] Connection binding notice:', err)
  }
})

// Broadcast functions
export function broadcastNFTUpdate(event: NFTUpdatedEvent) {
  for (const client of activeSocketClients) {
    try {
      client.emit('nft.updated', event)
    } catch {
      // ignore closed
    }
  }

}

export function broadcastOrderUpdate(event: OrderUpdatedEvent) {
  for (const client of activeSocketClients) {
    try {
      client.emit('order.updated', event)
    } catch {
      // ignore closed
    }
  }

}
