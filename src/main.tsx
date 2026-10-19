import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import { enableMocking } from './mocks/browser'
import './index.css'

enableMocking().then(() => {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
})
