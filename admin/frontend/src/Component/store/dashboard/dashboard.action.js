import axios from "axios";
import * as ActionType from "./dashboard.type";
import { Navigate, useNavigate } from "react-router-dom";
import { setToast } from "../../../util/toast";
import {baseURL , secretKey} from "../../../util/config"
import { apiInstanceFetch } from "../../../util/api";

const token = sessionStorage.getItem("token");


export const getDashboardCount = (startDate,endDate) => (dispatch) => {

  axios
    .get(`admin/dashboard/dashboardCount?startDate=${startDate}&endDate=${endDate}`, {
      Headers : {
        Authorization : token
      }
    })
    .then((res) => {
      dispatch({ type: ActionType.GET_DASHBOARD_COUNT, payload: res.data.dashboard });
    })
    .catch((error) => console.error(error));
};


export const getDashboardUserChart = (startDate, endDate, type) => (dispatch) => {
  const token = sessionStorage.getItem("token"); // Ensure token is available

  axios
    .get(`admin/dashboard/chartAnalytic?startDate=${startDate}&endDate=${endDate}&type=${type}`, {
      headers: {
        Authorization: token, // Corrected headers
      },
    })
    .then((res) => {
      let payloadData;

      // Dynamically set the correct response field based on `type`
      if (type === "Short") {
        payloadData = res.data.chartAnalyticOfShorts;
      } else if (type === "Video") {
        payloadData = res.data.chartAnalyticOfVideos;
      } else {
        payloadData = res.data.chartAnalyticOfUsers; // Change this if needed
      }

      dispatch({ type: ActionType.GET_DASHBOARD_USER, payload: payloadData, chartType: type });
    })
    .catch((error) => console.error(error));
};


export const getChartAnalyticOfActiveUser = (startDate,endDate,type) => (dispatch) => {
  axios
    .get(`admin/dashboard/chartAnalyticOfactiveInactiveUser?startDate=${startDate}&endDate=${endDate}&type=${"activeUser"}`, {
      Headers : {
        Authorization : token
      }
    })
    .then((res) => {
      dispatch({ type: ActionType.GET_DASHBOARD_ACTIVE_CHART, payload: res.data.data });
    })
    .catch((error) => console.error(error));
};

export const getDashboardHost = (startDate,endDate) => (dispatch) => {
  axios
    .get(`admin/dashboard/totalHostForAdminPenal?startDate=${startDate}&endDate=${endDate}`, {
      Headers : {
        Authorization : token
      }
    })
    .then((res) => {
        dispatch({ type: ActionType.GET_DASHBOARD_HOST, payload: res.host });
    })
    .catch((error) => console.error(error));
};

export const getUserChart = (type,startDate,endDate) => (dispatch) => {
  axios
    .get(`admin/dashboard/analyticOfdashboardCount?startDate=2023-07-22&endDate=2023-07-22&type=Video`, {
      Headers : {
        Authorization : token
      }
    })
    .then((res) => {
        dispatch({ type: ActionType.GET__USER_CHART, payload:res.user });
    })
    .catch((error) => console.error(error));
};

export const getRevenueChart = (type,startDate,endDate) => (dispatch) => {
  axios
    .get(`admin/dashboard/chartAnalyticForPenal?startDate=${startDate}&endDate=${endDate}&type=${type}`, {
      Headers : {
        Authorization : token
      }
    })
    .then((res) => {
      dispatch({ type: ActionType.GET_REVENUE_CHART, payload:res.revenue })
    })
    .catch((error) => console.error(error));
};



export const getDashboardHostFetch = (startDate, endDate) => {
  return async (dispatch) => {
    const url = `${baseURL}admin/dashboard/totalHostForAdminPenal?startDate=${startDate}&endDate=${endDate}`;
    const requestOptions = {
      method: "GET",
      Headers: { key: secretKey },
    };

    try {
      const response = await fetch(url, requestOptions);
      const res = await response.json();
      dispatch({ type: ActionType.GET_DASHBOARD_HOST_FETCH, payload: res.host });
    } catch (error) {
      return console.log(error);
    }
  };
};