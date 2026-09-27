import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Lead, LeadInput, LeadsResponse } from '../types'
import { createLead, deleteLead, getLead, getLeads, updateLead } from '../api/leads'
import { getErrorMessage } from '../api/axios'

interface LeadsState {
  items: Lead[]
  total: number
  page: number
  limit: number
  search: string
  searching: boolean
  listLoading: boolean
  listError: string | null
  currentLead: Lead | null
  detailLoading: boolean
  detailError: string | null
  saving: boolean
  deleting: boolean
  deleteError: string | null
}

const initialState: LeadsState = {
  items: [],
  total: 0,
  page: 0,
  limit: 10,
  search: '',
  searching: false,
  listLoading: false,
  listError: null,
  currentLead: null,
  detailLoading: false,
  detailError: null,
  saving: false,
  deleting: false,
  deleteError: null,
}

export const fetchLeads = createAsyncThunk<LeadsResponse, void, { rejectValue: string }>(
  'leads/fetchLeads',
  async (_, { getState, rejectWithValue }) => {
    const { search, page, limit } = (getState() as { leads: LeadsState }).leads
    try {
      return await getLeads({ search, page, limit })
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const fetchLead = createAsyncThunk<Lead, number, { rejectValue: string }>(
  'leads/fetchLead',
  async (id, { rejectWithValue }) => {
    try {
      return await getLead(id)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const saveLead = createAsyncThunk<Lead, { id?: number; input: LeadInput }, { rejectValue: string }>(
  'leads/saveLead',
  async ({ id, input }, { rejectWithValue }) => {
    try {
      if (id) {
        await updateLead(id, input)
        return await getLead(id)
      }
      return await createLead(input)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const removeLead = createAsyncThunk<number, number, { rejectValue: string }>(
  'leads/removeLead',
  async (id, { rejectWithValue }) => {
    try {
      await deleteLead(id)
      return id
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload.trim()
      state.searching = state.search !== ''
      state.page = 0
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload
      state.page = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.listLoading = true
        state.listError = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.listLoading = false
        state.items = action.payload.data
        state.total = action.payload.total
        if (action.payload.data.length === 0 && action.payload.total > 0 && state.page > 0) {
          state.page = Math.ceil(action.payload.total / state.limit) - 1
        }
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.listLoading = false
        state.listError = action.payload ?? 'Could not load leads'
      })
      .addCase(fetchLead.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
        state.currentLead = null
      })
      .addCase(fetchLead.fulfilled, (state, action) => {
        state.detailLoading = false
        state.currentLead = action.payload
      })
      .addCase(fetchLead.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload ?? 'Could not load lead'
      })
      .addCase(saveLead.pending, (state) => {
        state.saving = true
      })
      .addCase(saveLead.fulfilled, (state, action) => {
        state.saving = false
        state.currentLead = action.payload
      })
      .addCase(saveLead.rejected, (state) => {
        state.saving = false
      })
      .addCase(removeLead.pending, (state) => {
        state.deleting = true
        state.deleteError = null
      })
      .addCase(removeLead.fulfilled, (state) => {
        state.deleting = false
        state.currentLead = null
      })
      .addCase(removeLead.rejected, (state, action) => {
        state.deleting = false
        state.deleteError = action.payload ?? 'Could not delete the lead'
      })
  },
})

export const { setSearch, setPage, setLimit } = leadsSlice.actions
export default leadsSlice.reducer
