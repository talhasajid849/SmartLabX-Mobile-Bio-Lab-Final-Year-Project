import axios from "axios";
import { server } from "@/server/servert";

export const loadNotificationUser = (filter = "all") => async (dispatch) => {
  try {
    dispatch({ type: "LoadNotificationRequest" });

    const { data } = await axios.get(
      `${server}/notifications?filter=${filter}`,
      { withCredentials: true }
    );

    dispatch({
      type: "LoadNotificationSuccess",
      payload: data.notifications,
    });
  } catch (err) {
    dispatch({
      type: "LoadNotificationFail",
      payload: err.response?.data?.message || err.message,
    });
  }
};
