import { server } from "@/server/servert";
import axios from "axios";

// Load all Activity Logs with search and pagination
export const loadActivityLogs = (page = 1, limit = 50, search = "", action = "all") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadActivityLogsRequest" });

      let url = `${server}/admin/activity-logs?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (action !== "all") url += `&action=${action}`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      dispatch({
        type: "LoadActivityLogsSuccess",
        payload: {
          logs: data.logs,
          pagination: data.pagination,
        },
      });
    } catch (error) {
      dispatch({
        type: "LoadActivityLogsFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };