import { createReducer } from "@reduxjs/toolkit";

const activityLogsInitialState = {
  logs: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
};

export const activityLogsReducer = createReducer(activityLogsInitialState, (builder) => {
  builder
    .addCase("LoadActivityLogsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("LoadActivityLogsSuccess", (state, action) => {
      state.loading = false;
      state.logs = action.payload.logs;
      state.pagination = action.payload.pagination;
      state.error = null;
    })
    .addCase("LoadActivityLogsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
});