import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, ApiError } from "@/lib/api";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/lib/tokenStorage";
import type { FieldError, User } from "@/lib/types";

export type AuthError = {
  message: string;
  errors?: FieldError[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
};

type Session = {
  token: string | null;
  user: User | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
};

const toAuthError = (error: unknown, fallback: string): AuthError => {
  if (error instanceof ApiError) {
    return { message: error.message, errors: error.errors };
  }
  return { message: fallback };
};

export const restoreSession = createAsyncThunk<Session>(
  "auth/restore",
  async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      return { token: null, user: null };
    }

    try {
      const result = await api<{ user: User }>("/auth/me");
      return { token: getAccessToken(), user: result.user };
    } catch {
      clearTokens();
      return { token: null, user: null };
    }
  },
);

type AuthResponse = {
  token: string;
  refreshToken: string;
  user: User;
};

export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: AuthError }
>("auth/login", async (body, { rejectWithValue }) => {
  try {
    const result = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    saveTokens(result.token, result.refreshToken);
    return result;
  } catch (error) {
    return rejectWithValue(toAuthError(error, "Could not log in"));
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: AuthError }
>("auth/register", async (body, { rejectWithValue }) => {
  try {
    const result = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    saveTokens(result.token, result.refreshToken);
    return result;
  } catch (error) {
    return rejectWithValue(toAuthError(error, "Could not create account"));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  const refreshToken = getRefreshToken();
  clearTokens();
  if (!refreshToken) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api"}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => undefined);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken(state, action: { payload: string | null }) {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(logout.pending, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
      });
  },
});

export const { setAccessToken } = authSlice.actions;
export default authSlice.reducer;
