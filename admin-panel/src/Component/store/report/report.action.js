import axios from "axios";
import * as ActionType from "./report.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

export const getVideoReport = (start, limit, startDate, endDate, type, search = "") => (dispatch) => {
  apiInstanceFetch
    .get(`admin/report/getReports?start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&videoType=${type}&search=${search || ""}`)
    .then((res) => {
      dispatch({ type: ActionType.GET_VIDEO_REPORT, payload: { data: res.reports, totalData: res.totalReports, videoType: type } });
    })
    .catch((error) => console.error(error));
};

export const deleteVideoReport = (id) => (dispatch) => {
  axios
    .delete(`admin/report/deleteVideoReport?reportId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.DELETE_VIDEO_REPORT, payload: { id: id } });
        setToast("success", "Video Report Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};

export const cleanReportData = () => (dispatch) => {
  dispatch({ type: ActionType.CLEAN_REPORT });
};
