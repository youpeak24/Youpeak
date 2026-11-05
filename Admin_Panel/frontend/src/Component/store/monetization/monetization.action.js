import axios from "axios";
import { apiInstanceFetch } from "../../../util/api";
import * as ActionType from "./monetization.type";
import { setToast } from "../../../util/toast";

export const getMonetizationRequest =
  (type, start, limit, startDate, endDate, search = "") => (dispatch) => {
    apiInstanceFetch
      .get(
        `admin/monetizationRequest/getAllMonetizationRequests?type=${type}&start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search || ""}`
      )
      .then((res) => {
        dispatch({
          type: ActionType.GET_MONETIZATION_REQUEST,
          payload: {
            request: res.request,
            total: res.total,
            type,
          },
        });
      })
      .catch((error) => console.error(error));
  };

export const acceptOrDeclineRequest = (id, type, reason) => (dispatch) => {
  axios
    .patch(
      `admin/monetizationRequest/handleMonetizationRequest?monetizationRequestId=${id}&type=${type}&reason=${reason}`
    )
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.ACCEPT_MONETIZATION_REQUEST,
          payload: {
            reqestData: res.data.request,
            requestId: id,
          },
        });
        type === 2 ? setToast("success", "Request Accept Successfully") : setToast("success", "Request Decline Successfully");
      }
    })
    .catch((error) => console.log("error", error));
};
