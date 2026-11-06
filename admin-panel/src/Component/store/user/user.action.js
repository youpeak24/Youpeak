import axios from "axios";
import * as ActionType from "./user.type";
import { Navigate, useNavigate } from "react-router-dom";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

export const getUser =
  (type, start, limit, startDate, endDate, search = "", blockStatus = "") =>
  (dispatch) => {
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("start", String(start));
    params.set("limit", String(limit));
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    params.set("search", search || "");
    if (blockStatus === "true" || blockStatus === "false") {
      params.set("isBlock", blockStatus);
    }

    apiInstanceFetch
      .get(`admin/user/getUsers?${params.toString()}`)
      .then((res) => {

        dispatch({
          type: ActionType.GET_USER,
          payload: {
            user: res.users,
            totalUser: res.total,
          },
        });
      })
      .catch((error) => console.error(error));
  };
export const isActiveUser = (id, type, data) => (dispatch) => {
  const ids = Array.isArray(id) ? id.join(",") : id;
  return axios
    .patch(`admin/user/isBlock?userId=${ids}&isBlock=${data}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.ACTIVE_SWITCH_USER,
          payload: { data: res.data.users || res.data.user, id: id, type: type },
        });
        setToast(
          "success",
          data === true
            ? `User Block SuccessFully`
            : "User Unblock SuccessFully"
        );
      } else {
        setToast("error", res.data.message);
      }
      return res;
    })
    .catch((error) => {
      console.log("error", error.message);
      throw error;
    });
};

export const togglePaymentStatus = (id) => (dispatch) => {
  return axios
    .patch(`admin/user/togglePaymentStatus?userId=${id}`)
    .then((res) => {
      if (res.data.status) {
        setToast("success", res.data.message);
        dispatch({
          type: ActionType.ACTIVE_SWITCH_USER,
          payload: { data: res.data.user, id: id, type: "user" },
        });
      } else {
        setToast("error", res.data.message);
      }
      return res;
    })
    .catch((error) => {
      console.log("error", error.message);
      throw error;
    });
};

export const deleteUser = (id, type) => (dispatch) => {
  const ids = Array.isArray(id) ? id : [id];
  return axios
    .delete(`admin/user/deleteUsers?userId=${ids.join(",")}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          // Always an array — the reducer's `.includes(data._id)` check
          // does substring matching on a plain string, not membership.
          type: ActionType.DELETE_USER,
          payload: { id: ids, type: type },
        });
        setToast("success", "User Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
      return res;
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};

export const getUserProfile = (id) => (dispatch) => {
  apiInstanceFetch
    .get(`admin/user/getProfile?userId=${id}`)
    .then((res) => {
      dispatch({ type: ActionType.GET_USER_PROFILE, payload: res.user });
    })
    .catch((error) => console.error(error));
};



export const editUserProfile = (id, data, isChannel) => (dispatch) => {
  axios
    .patch(`admin/user/updateUser?userId=${id}&isChannel=${isChannel}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.USER_EDIT_PROFILE,
          payload: { data: res.data.user, id: id },
        });
        setToast(
          "success",
          `${res.data.user.fullName + " " + "Update SuccessFully"} `
        );
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const createFakeUser = (formData) => (dispatch) => {
  axios
    .post("admin/user/fakeUser", formData)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({ type: ActionType.CREATE_FAKE_USER, payload: res.data.user });
        setToast("success", "Fake User created Successfully !");
      }
    })
    .catch((error) => console.error(error));
};

export const getIpAddress = () => (dispatch) => {
  fetch("https://api.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => {
      dispatch({ type: ActionType.GET_IP_ADDRESS, payload: data });
    })
    .catch((error) => {
      console.error("Error fetching IP address:", error);
    });
};

export const getFakeUser =
  (start, limit, startDate, endDate, type, search = "", blockStatus = "") =>
  (dispatch) => {
    const params = new URLSearchParams();
    params.set("start", String(start));
    params.set("limit", String(limit));
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    params.set("type", type);
    params.set("search", search || "");
    if (blockStatus === "true" || blockStatus === "false") {
      params.set("isBlock", blockStatus);
    }

    apiInstanceFetch
      .get(`admin/user/getUsers?${params.toString()}`)
      .then((res) => {
        dispatch({
          type: ActionType.GET_FAKE_USER,
          payload: { data: res.users, total: res.total },
        });
      })
      .catch((error) => console.error(error));
  };

export const passwordChange = (id, data) => (dispatch) => {
  axios
    .patch(`admin/user/updatePassword`, data)
    .then((res) => {
      if (res.status) {
        dispatch({
          type: ActionType.PAASWORD_CHANGE_API,
          payload: { data: res.data.user, id: id },
        });

        setToast("success", "Password Change SuccessFully");
      } else {
        setToast("error", res.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const getUserChannels =
  (start, limit, startDate, endDate, type, search = "") => (dispatch) => {
    apiInstanceFetch
      .get(
        `admin/user/channelsOfUser?start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&type=${type}&search=${search || ""}`
      )
      .then((res) => {
        dispatch({
          type:
            type == "realUser"
              ? ActionType.GET_USER_CHANNEL_DATA
              : ActionType.GET_FAKE_USER_CHANNEL_DATA,
          payload: {
            channel: res.channels,
            total: res.total,
          },
        });
      })
      .catch((error) => console.error(error));
  };

export const createChannelFakeUser = (id, createChannel) => (dispatch) => {
  axios
    .patch(`admin/user/updateUser?userId=${id}&isChannel=true`, createChannel)
    .then((res) => {
      if (res.data.status) {
        const channelData = res.data.user;
        const type = ActionType.CREATE_FAKE_USER_CHANNEL;
        dispatch({
          type,
          payload: { channelData, id, type },
        });
        setToast("success", "Channel Create SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const getFakeUserName = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/user/getUsersAddByAdminForChannel`)
    .then((res) => {
      dispatch({ type: ActionType.GET_FAKE_USER_NAME, payload: res.users });
    })
    .catch((error) => console.error(error));
};


export const deleteChanel = (id) => (dispatch) => {
  axios
    .patch(
      `admin/user/deleteChannelByAdmin?channelId=${id}`
    )
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.DELETE_CHANEL, payload: { id: id } });
        setToast("success", "Chanel Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};


export const cleanUserData = () => (dispatch) => {
  dispatch({ type: ActionType.CLEAN_USER });
};