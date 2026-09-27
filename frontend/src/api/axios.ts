import axios from 'axios'

const api = axios.create({
  baseURL: '/',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error);
    if (error.response?.status === 401) {
      console.log("response --> ");
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    console.log("inside the isAxoisError --->");
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) {
      return data.message.join(', ')
    }
    return data?.message ?? 'Something went wrong'
  }
  return 'Something went wrong'
}

export default api
