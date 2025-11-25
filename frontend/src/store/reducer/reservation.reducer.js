import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  reservations: [],
  loading: false,
  error: null,
  pagination: { 
    page: 1, 
    limit: 10, 
    total: 0, 
    totalPages: 1 
  },
  updateLoading: false,
};

export const reservationReducer = createReducer(initialState, (builder) => {
  builder
    // Load Reservations
    .addCase("LoadReservationsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("LoadReservationsSuccess", (state, action) => {
      state.loading = false;
      state.reservations = action.payload.reservations;
      state.pagination = action.payload.pagination;
      state.error = null;
    })
    .addCase("LoadReservationsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // Update Reservation Status
    .addCase("UpdateReservationStatusRequest", (state) => {
      state.updateLoading = true;
    })
    .addCase("UpdateReservationStatusSuccess", (state) => {
      state.updateLoading = false;
    })
    .addCase("UpdateReservationStatusFail", (state, action) => {
      state.updateLoading = false;
      state.error = action.payload;
    });
});