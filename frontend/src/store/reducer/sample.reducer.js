import { createReducer } from "@reduxjs/toolkit";

// ==================== SAMPLES REDUCER ====================
const samplesInitialState = {
  samples: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  updateLoading: false,
};

export const samplesReducer = createReducer(samplesInitialState, (builder) => {
  builder
    .addCase("LoadSamplesRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("LoadSamplesSuccess", (state, action) => {
      state.loading = false;
      state.samples = action.payload.samples;
      state.pagination = action.payload.pagination;
      state.error = null;
    })
    .addCase("LoadSamplesFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("UpdateSampleRequest", (state) => {
      state.updateLoading = true;
    })
    .addCase("UpdateSampleSuccess", (state) => {
      state.updateLoading = false;
    })
    .addCase("UpdateSampleFail", (state, action) => {
      state.updateLoading = false;
      state.error = action.payload;
    })
    .addCase("UpdateSampleStatusRequest", (state) => {
      state.updateLoading = true;
    })
    .addCase("UpdateSampleStatusSuccess", (state) => {
      state.updateLoading = false;
    })
    .addCase("UpdateSampleStatusFail", (state, action) => {
      state.updateLoading = false;
      state.error = action.payload;
    })
    .addCase("DeleteSampleRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteSampleSuccess", (state, action) => {
      state.loading = false;
      state.samples = state.samples.filter(s => s.samples_id !== action.payload);
    })
    .addCase("DeleteSampleFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
});
