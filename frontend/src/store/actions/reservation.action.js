import { server } from "@/server/servert";
import axios from "axios";

// Load all Reservations with search and pagination
export const loadReservations =
  (page = 1, limit = 10, search = "", status = "all") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadReservationsRequest" });

      let url = `${server}/reservations/all?page=${page}&limit=${limit}`;

      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (status && status !== "all") {
        url += `&status=${status}`;
      }

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      dispatch({
        type: "LoadReservationsSuccess",
        payload: {
          reservations: data.requests || [], // Fixed: was data.requests
          pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      });
    } catch (error) {
      dispatch({
        type: "LoadReservationsFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Update reservation status
export const updateReservationStatus = (id, status) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateReservationStatusRequest" });

    const { data } = await axios.put(
      `${server}/reservations/${id}/status`,
      { status },
      { withCredentials: true }
    );

    dispatch({
      type: "UpdateReservationStatusSuccess",
      payload: data,
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "UpdateReservationStatusFail",
      payload: error.response?.data?.message || error.message,
    });
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};