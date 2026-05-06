import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDiscovery = createAsyncThunk(
    'interazioni/fetchDiscovery',
    async ({ caneId, intento }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/interazioni/discovery/${caneId}?intento=${intento}`);
            return response.data.cani;
        } catch (err) {
            return rejectWithValue(err.response?.data || "Errore caricamento cani");
        }
    }
);

export const swipeLike = createAsyncThunk(
    'interazioni/swipeLike',
    async ({ mittenteCaneId, destinatarioCaneId, intento }, { rejectWithValue }) => {
        try {
            const response = await api.post('/interazioni/like', {
                mittenteCaneId,
                destinatarioCaneId,
                intento
            });
            return { destinatarioCaneId, isMatch: response.data.isMatch };
        } catch (err) {
            return rejectWithValue(err.response?.data || "Errore invio like");
        }
    }
);

export const swipeDislike = createAsyncThunk(
    'interazioni/swipeDislike',
    async ({ mittenteCaneId, destinatarioCaneId }, { rejectWithValue }) => {
        try {
            await api.post('/interazioni/dislike', { mittenteCaneId, destinatarioCaneId });
            return { destinatarioCaneId };
        } catch (err) {
            return rejectWithValue(err.response?.data || "Errore invio dislike");
        }
    }
);

const interazioneSlice = createSlice({
    name: 'interazioni',
    initialState: {
        discoveryStack: [],
        loading: false,
        lastMatch: null,
        error: null
    },
    reducers: {
        clearMatch: (state) => { state.lastMatch = null; },
        resetInterazioni: (state) => {
            state.discoveryStack = [];
            state.lastMatch = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        const resetState = (state) => {
            state.discoveryStack = [];
            state.lastMatch = null;
            state.error = null;
        };
        builder
            .addCase('auth/logout', resetState)
            .addCase('auth/logout/pending', resetState)
            .addCase('auth/logout/fulfilled', resetState)
            .addCase('auth/loginUser/fulfilled', resetState)
            .addCase(fetchDiscovery.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDiscovery.fulfilled, (state, action) => {
                state.loading = false;
                state.discoveryStack = action.payload;
            })
            .addCase(fetchDiscovery.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(swipeLike.fulfilled, (state, action) => {
                state.discoveryStack = state.discoveryStack.filter(c => c.id !== action.payload.destinatarioCaneId);
                if (action.payload.isMatch) {
                    state.lastMatch = action.payload.isMatch;
                }
            })
            .addCase(swipeLike.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(swipeDislike.fulfilled, (state, action) => {
                state.discoveryStack = state.discoveryStack.filter(c => c.id !== action.payload.destinatarioCaneId);
            })
            .addCase(swipeDislike.rejected, (state, action) => {
                state.error = action.payload;
            });
    }
});

export const { clearMatch, resetInterazioni } = interazioneSlice.actions;
export default interazioneSlice.reducer;
