import axios from "axios";
import { apiInstanceFetch } from "../../../util/api";
import * as ActionType from "./withdraw.type";
import { setToast } from "../../../util/toast";

export const getWithDrawRequest =
  (type, start, limit, startDate, endDate, search = "") => (dispatch) => {
    apiInstanceFetch
      .get(
        `admin/withDrawalRequest?type=${type}&start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search || ""}`
      )
      .then((res) => {
        dispatch({
          type: ActionType.GET_WITHDRAW_REQUEST,
          payload: {
            request: res.request,
            total: res.total,
            type,
          },
        });
      })
      .catch((error) => console.error(error));
  };

export const acceptRequest = (id) => (dispatch) => {
  axios
    .patch(`admin/withDrawalRequest/accept?requestId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.ACCEPT_WITHDRAW_REQUEST,
          payload: {
            reqestData: res.data.request,
            requestId: id,
          },
        });
        setToast("success", "Request Accept Successfully");
      }
    })
    .catch((error) => console.log("error", error));
};

export const declineRequest = (id, reason) => (dispatch) => {
  axios
    .patch(`admin/withDrawalRequest/decline?requestId=${id}&reason=${reason}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.DECLINE_WITHDRAW_REQUEST,
          payload: {
            data: res.data.request,
            requestId: id,
          },
        });
        setToast("success", "Request Decline Successfully");
      }
    })
    .catch((error) => console.log("error", error));
};
