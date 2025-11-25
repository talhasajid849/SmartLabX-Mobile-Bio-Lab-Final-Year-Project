import { createReducer } from "@reduxjs/toolkit";

// ==================== PROTOCOLS REDUCER ====================
const protocolsInitialState = {
  protocols: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

export const protocolsReducer = createReducer(protocolsInitialState, (builder) => {
  builder
    .addCase("LoadProtocolsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("LoadProtocolsSuccess", (state, action) => {
      state.loading = false;
      state.protocols = action.payload.protocols;
      state.pagination = action.payload.pagination;
      state.error = null;
    })
    .addCase("LoadProtocolsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("DeleteProtocolRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteProtocolSuccess", (state, action) => {
      state.loading = false;
      state.protocols = state.protocols.filter(p => p.protocols_id !== action.payload);
    })
    .addCase("DeleteProtocolFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
});