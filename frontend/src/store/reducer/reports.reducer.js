import { createReducer } from "@reduxjs/toolkit";

const reportsInitialState = {
  reports: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

export const reportsReducer = createReducer(reportsInitialState, (builder) => {
  builder
    .addCase("LoadReportsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("LoadReportsSuccess", (state, action) => {
      state.loading = false;
      state.reports = action.payload.reports;
      state.pagination = action.payload.pagination;
      state.error = null;
    })
    .addCase("LoadReportsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ExportReportRequest", (state) => {
      state.loading = true;
    })
    .addCase("ExportReportSuccess", (state) => {
      state.loading = false;
    })
    .addCase("ExportReportFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("DeleteReportRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteReportSuccess", (state, action) => {
      state.loading = false;
      state.reports = state.reports.filter(r => r.report_id !== action.payload);
    })
    .addCase("DeleteReportFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
});
