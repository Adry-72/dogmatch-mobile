import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotifiche = createAsyncThunk(
    'notifiche/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/notifiche');
            return res.data.notifiche;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Errore caricamento notifiche');
        }
    }
);

export const segnaLetta = createAsyncThunk(
    'notifiche/segnaLetta',
    async (id, { rejectWithValue }) => {
        try {
            await api.patch(`/notifiche/${id}/letto`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Errore');
        }
    }
);

export const segnaLetteTutte = createAsyncThunk(
    'notifiche/segnaLetteTutte',
    async (_, { rejectWithValue }) => {
        try {
            await api.patch('/notifiche/segna-tutte-lette');
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Errore');
        }
    }
);

const notificheSlice = createSlice({
    name: 'notifiche',
    initialState: {
        lista: [],
        loading: false,
    },
    reducers: {
        aggiungiNotifica: (state, action) => {
            state.lista.unshift(action.payload);
        },
        resetNotifiche: (state) => {
            state.lista = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifiche.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifiche.fulfilled, (state, action) => {
                state.loading = false;
                state.lista = action.payload;
            })
            .addCase(fetchNotifiche.rejected, (state) => { state.loading = false; })
            .addCase(segnaLetta.fulfilled, (state, action) => {
                const n = state.lista.find(n => n.id === action.payload);
                if (n) n.letto = true;
            })
            .addCase(segnaLetteTutte.fulfilled, (state) => {
                state.lista.forEach(n => { n.letto = true; });
            })
            .addCase('auth/logout', (state) => { state.lista = []; });
    },
});

export const { aggiungiNotifica, resetNotifiche } = notificheSlice.actions;
export const selectNonLette = (state) => state.notifiche.lista.filter(n => !n.letto).length;
export default notificheSlice.reducer;
