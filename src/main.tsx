import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Fetch the app and mock handlers together; render only after MSW is ready.
const mockingPromise = import('./mocks/browser').then(({ enableMocking }) => enableMocking())
const appPromise = import('./app/App')

Promise.all([mockingPromise, appPromise]).then(([, { App }]) => {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
})
