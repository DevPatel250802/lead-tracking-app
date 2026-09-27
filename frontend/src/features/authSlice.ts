import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { login } from '../api/auth'
import { getErrorMessage } from '../api/axios'

interface Credentials {
  email: string
  password: string
}

interface LoginPayload {
  token: string
  email: string
}

interface AuthState {
  token: string | null
  email: string | null
  loading: boolean
  error: string | null
}

export const loginUser = createAsyncThunk<LoginPayload, Credentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials.email, credentials.password)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user_email', credentials.email)
      return { token: response.access_token, email: credentials.email }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

const initialState: AuthState = {
  token: localStorage.getItem('access_token'),
  email: localStorage.getItem('user_email'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.email = null
      state.error = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.email = action.payload.email
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Login failed'
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
