import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to inject auth token and scenario headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nft_auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Support testing scenario headers
    const activeScenario = localStorage.getItem('nft_active_scenario')
    if (activeScenario && config.headers) {
      config.headers['X-Mock-Scenario'] = activeScenario
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with structured error formatting
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; code?: string }>) => {
    if (error.response?.status === 401) {
      // Session expired or unauthorized
      const isAuthEndpoint = error.config?.url?.includes('/auth/')
      if (!isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent('nft:session-expired'))
      }
    }

    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Ocorreu um erro na requisição'

    const enhancedError = new Error(customMessage) as Error & {
      status?: number
      code?: string
      response?: typeof error.response
    }
    enhancedError.status = error.response?.status
    enhancedError.code = error.response?.data?.code || error.code
    enhancedError.response = error.response

    return Promise.reject(enhancedError)
  }
)
