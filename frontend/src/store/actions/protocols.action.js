import { server } from "@/server/servert";
import axios from "axios";

// Load all Protocols with search and pagination
export const loadProtocols =
  (page = 1, limit = 10, search = "", category = "all", experimentType = "all") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadProtocolsRequest" });

      let url = `${server}/protocols/?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category !== "all") url += `&category=${category}`;
      if (experimentType !== "all") url += `&experimentType=${experimentType}`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      dispatch({
        type: "LoadProtocolsSuccess",
        payload: {
          protocols: data.protocols,
          pagination: data.pagination,
        },
      });
    } catch (error) {
      dispatch({
        type: "LoadProtocolsFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Delete protocol
export const deleteProtocol = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteProtocolRequest" });

    await axios.delete(`${server}/protocols/${id}`, {
      withCredentials: true,
    });

    dispatch({
      type: "DeleteProtocolSuccess",
      payload: id,
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "DeleteProtocolFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};