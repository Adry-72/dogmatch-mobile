import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api";
import { getItem, setItem, deleteItem } from "../../services/storage";

export const restoreToken = createAsyncThunk("auth/restoreToken", async () => {
  const token = await getItem("userToken");
  const userString = await getItem("userData");

  if (token && userString) {
    return { token, user: JSON.parse(userString) };
  }
  throw new Error("Nessun token trovato");
});

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      const { user, token, cane } = response.data;

      const formattedUser = {
        ...user,
        iMieiCani: user.iMieiCani || (cane ? [cane] : [])
      };

      await setItem("userToken", token);
      await setItem("userData", JSON.stringify(formattedUser));

      return { user: formattedUser, token };
    } catch (error) {
      console.error("[loginUser]", error.message, error.response?.status, error.response?.data);
      if (!error.response) {
        return rejectWithValue("Impossibile contattare il server. Verifica la connessione o il CORS del backend.");
      }
      return rejectWithValue(error.response?.data?.errore || "Errore di login");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { user, cane, token } = response.data;
      const userWithDog = { ...user, iMieiCani: cane ? [cane] : [] };

      await setItem("userToken", token);
      await setItem("userData", JSON.stringify(userWithDog));

      return { user: userWithDog, token };
    } catch (error) {
      return rejectWithValue(error.response?.data?.errore || "Errore registrazione");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user;
      await setItem("userData", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.errore || "Errore durante l'aggiornamento");
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await deleteItem("userToken");
  await deleteItem("userData");
});

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreToken.pending, (state) => { state.loading = true; })
      .addCase(restoreToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(restoreToken.rejected, (state) => { state.loading = false; })

      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(registerUser.pending, (state) => { state.loading = true; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateProfile.pending, (state) => { state.loading = true; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
