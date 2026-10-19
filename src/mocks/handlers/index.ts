import { authHandlers } from './auth'
import { nftHandlers } from './nfts'
import { cartHandlers } from './cart'
import { quoteHandlers } from './quote'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { systemHandlers } from './system'
import { socketHandler } from '../socketBinding'

export const handlers = [
  socketHandler,
  ...authHandlers,
  ...nftHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...systemHandlers,
]
