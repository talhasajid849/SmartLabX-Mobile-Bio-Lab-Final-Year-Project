import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  users: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

export const userReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("LoadUserREquest", (state) => {
      state.loading = true;
    })
    .addCase("LoadUserSuccess", (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
    })
    .addCase("LoadUserFailed", (state, action) => {
      state.isAuthenticated = false;
      state.error = action.payload;
      state.loading = false;
    })

    // Get All the users

    .addCase("LoadUsersREquest", (state) => {
      state.loading = true;
    })
    .addCase("LoadUsersSuccess", (state, action) => {
      state.loading = false;
      state.users = action.payload.users; // ✅ only the array
      state.pagination = action.payload.pagination;
    })
    .addCase("LoadUsersFailed", (state, action) => {
      state.error = action.payload;
      state.loading = false;
    })

    // Loigout the user
    .addCase("LogoutUserREquest", (state) => {
      state.loading = true;
    })
    .addCase("LogoutUserSuccess", (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
    })
    .addCase("LogoutUserFailed", (state, action) => {
      state.error = action.payload;
      state.loading = false;
    });
});
