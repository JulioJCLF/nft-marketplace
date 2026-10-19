import { io, Socket } from 'socket.io-client'

const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000'
  return `${window.location.protocol}//${window.location.host}`
}

export const socket: Socket = io(getSocketUrl(), {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
})
