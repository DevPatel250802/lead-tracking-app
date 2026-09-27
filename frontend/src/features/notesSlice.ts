import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { Note, NotesResponse } from '../types'
import { addNote, getNotes } from '../api/leads'
import { getErrorMessage } from '../api/axios'

interface NotesState {
  items: Note[]
  total: number
  page: number
  loading: boolean
  error: string | null
  adding: boolean
}

interface FetchNotesArgs {
  leadId: number
  page?: number
}

export const NOTES_PAGE_SIZE = 10

export const fetchNotes = createAsyncThunk<NotesResponse, FetchNotesArgs, { rejectValue: string }>(
  'notes/fetchNotes',
  async ({ leadId, page = 0 }, { rejectWithValue }) => {
    try {
      return await getNotes(leadId, page, NOTES_PAGE_SIZE)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const addNoteForLead = createAsyncThunk<Note, { leadId: number; content: string }, { rejectValue: string }>(
  'notes/addNoteForLead',
  async ({ leadId, content }, { rejectWithValue }) => {
    try {
      return await addNote(leadId, content)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

const initialState: NotesState = {
  items: [],
  total: 0,
  page: 0,
  loading: false,
  error: null,
  adding: false,
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true
        state.error = null
        state.items = []
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.page = action.meta.arg.page ?? 0
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Could not load notes'
      })
      .addCase(addNoteForLead.pending, (state) => {
        state.adding = true
        state.error = null
      })
      .addCase(addNoteForLead.fulfilled, (state) => {
        state.adding = false
        state.total += 1
      })
      .addCase(addNoteForLead.rejected, (state, action) => {
        state.adding = false
        state.error = action.payload ?? 'Could not add the note'
      })
  },
})

export default notesSlice.reducer
