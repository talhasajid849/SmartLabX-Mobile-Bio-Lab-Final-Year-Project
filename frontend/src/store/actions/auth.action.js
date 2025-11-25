import { server } from "@/server/servert";
import axios from "axios";

// Load user
export const loadUser = () => async (dispatch) => {
  try {
    dispatch({
      type: "LoadUserREquest",
    });

    const { data } = await axios.get(`${server}/auth/getuser`, {
      withCredentials: true,
    });

    // console.log(data, "user")
    dispatch({
      type: "LoadUserSuccess",
      payload: data.user,
    });

    return data.user;
  } catch (error) {
    dispatch({
      type: "LoadUserFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};



// Load all Users For the admin
export const loadUsersAdmin =
  (page = 1, limit = 10, search = "", role = "all") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadUsersREquest" });

      // components/common/Pagination.jsx
      let url = `${server}/admin/users?page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (role !== "all") url += `&role=${role}`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      dispatch({
        type: "LoadUsersSuccess",
        payload: {
          users: data.users,
          pagination: data.pagination,
        },
      });
    } catch (err) {
      dispatch({
        type: "LoadUsersFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };



// logout user
export const logoutUser = () => async (dispatch) => {
  try {
    dispatch({
      type: "LogoutUserREquest",
    });

    const { data } = await axios.get(`${server}/auth/logout`, {
      withCredentials: true,
    });

    console.log(data, "user");
    dispatch({
      type: "LogoutUserSuccess",
    });
  } catch (error) {
    dispatch({
      type: "LogoutUserFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
