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
  /** Contenu de `data` sur une réponse d'erreur (ex. `verrouilleJusquA` du kiosque) — rare, la
   * plupart des erreurs n'en ont pas. */
  data?: unknown
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Le backend retourne { success: false, error: "...", data?: ... } — on lit le champ 'error',
    // 'data' est conservé tel quel pour les rares cas où l'erreur porte une charge utile.
    const backendMessage: string | undefined =
      error.response?.data?.error ?? error.response?.data?.message
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: backendMessage ?? error.message ?? 'Erreur réseau',
      data: error.response?.data?.data,
    }
    return Promise.reject(apiError)
  },
)
