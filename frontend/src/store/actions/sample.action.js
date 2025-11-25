import { server } from "@/server/servert";
import axios from "axios";

// Load all Samples with search, filters and pagination
export const loadSamples =
  (page = 1, limit = 20, search = "", type = "all", status = "all", sortBy = "created_at", order = "DESC") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadSamplesRequest" });

      let url = `${server}/admin/samples/?page=${page}&limit=${limit}&sort_by=${sortBy}&order=${order}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (type !== "all") url += `&type=${type}`;
      if (status !== "all") url += `&status=${status}`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      dispatch({
        type: "LoadSamplesSuccess",
        payload: {
          samples: data.samples,
          pagination: data.pagination,
        },
      });
    } catch (error) {
      dispatch({
        type: "LoadSamplesFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Update sample
export const updateSample = (id, formData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateSampleRequest" });

    const { data } = await axios.put(
      `${server}/samples/admin/${id}`,
      formData,
      { withCredentials: true }
    );

    dispatch({
      type: "UpdateSampleSuccess",
      payload: data,
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "UpdateSampleFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Update sample status
export const updateSampleStatus = (id, status) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateSampleStatusRequest" });

    await axios.put(
      `${server}/samples/admin/status/${id}`,
      { status },
      { withCredentials: true }
    );

    dispatch({
      type: "UpdateSampleStatusSuccess",
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "UpdateSampleStatusFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Delete sample
export const deleteSample = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteSampleRequest" });

    await axios.delete(`${server}/samples/admin/${id}`, {
      withCredentials: true,
    });

    dispatch({
      type: "DeleteSampleSuccess",
      payload: id,
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "DeleteSampleFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};