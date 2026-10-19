import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { NFTUpdatedEvent, OrderUpdatedEvent } from '@/types'

// Active simulated Socket.IO connections
interface SocketClient {
  emit: (event: string, ...args: unknown[]) => void
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

const activeSocketClients = new Set<SocketClient>()

// Define the MSW WebSocket handler for Socket.IO
// Matching any origin connecting to /socket.io
export const socketIoEndpoint = ws.link(
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/socket.io`
    : 'ws://localhost:3000/socket.io'
)

export const socketHandler = socketIoEndpoint.addEventListener('connection', (connection) => {
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

// Cross-window / in-app event bus for fallback and test dispatching
export const REALTIME_EVENT_BUS = typeof window !== 'undefined' ? new EventTarget() : null

// Broadcast functions
export function broadcastNFTUpdate(event: NFTUpdatedEvent) {
  // 1. Emit to all active socket.io-binding connections
  for (const client of activeSocketClients) {
    try {
      client.emit('nft.updated', event)
    } catch {
      // ignore closed
    }
  }

  // 2. Emit to in-app event bus for instant deterministic testing
  if (REALTIME_EVENT_BUS) {
    REALTIME_EVENT_BUS.dispatchEvent(new CustomEvent('nft.updated', { detail: event }))
  }
}

export function broadcastOrderUpdate(event: OrderUpdatedEvent) {
  // 1. Emit to all active socket.io-binding connections
  for (const client of activeSocketClients) {
    try {
      client.emit('order.updated', event)
    } catch {
      // ignore closed
    }
  }

  // 2. Emit to in-app event bus
  if (REALTIME_EVENT_BUS) {
    REALTIME_EVENT_BUS.dispatchEvent(new CustomEvent('order.updated', { detail: event }))
  }
}
