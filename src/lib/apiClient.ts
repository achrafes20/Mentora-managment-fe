import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Le contexte de session (T1.A1) appelle setAuthToken au login/logout.
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

export interface ApiError {
  status: number
  message: string
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Le backend retourne { success: false, error: "..." } — on lit le champ 'error'
    const backendMessage: string | undefined =
      error.response?.data?.error ?? error.response?.data?.message
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: backendMessage ?? error.message ?? 'Erreur réseau',
    }
    return Promise.reject(apiError)
  },
)
