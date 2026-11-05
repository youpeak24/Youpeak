import axios from "axios";
import * as ActionType from "./shorts.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

export const getShortsApi =
  (
    type,
    start,
    limit,
    startDate,
    endDate,
    search = "",
    visibilityType,
    audienceType,
    commentType,
    scheduleType
  ) =>
    (dispatch) => {
      const params = new URLSearchParams();
      params.set("videoType", type);
      params.set("start", start);
      params.set("limit", limit);
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      params.set("search", search || "");

      if (visibilityType) params.set("visibilityType", visibilityType);
      if (audienceType) params.set("audienceType", audienceType);
      if (commentType) params.set("commentType", commentType);
      if (scheduleType) params.set("scheduleType", scheduleType);

      apiInstanceFetch
        .get(`admin/video/videosOrShorts?${params.toString()}`)
        .then((res) => {
          dispatch({
            type: ActionType.GET_SHORTS,
            payload: {
              shortsData: res.videosOrShorts,
              totalShorts: res.totalVideosOrShorts,
            },
          });
        })
        .catch((error) => console.error(error));
    };

export const createShort = (formData) => (dispatch) => {
  for (let key in formData) {
    console.log(key, formData[key]);
  }

  axios
    .post("admin/video/uploadVideo", formData)
    .then((res) => {

      if (res.data.status) {
        dispatch({ type: ActionType.IMPORT_SHORT, payload: res.data.video });
        setToast("success", "Short created Successfully !");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const editShort = (data, videoId, userId, channelIdFind, type, fullNameUser) => (dispatch) => {
  axios
    .patch(`admin/video/updateVideo?videoId=${videoId}&userId=${userId}&channelId=${channelIdFind}&videoType=${type}`, data)
    .then((res) => {
      if (res.data.status) {

        dispatch({
          type: ActionType.EDIT_SHORT,
          payload: { data: res.data.video, videoId: videoId, fullName: fullNameUser },
        });
        setToast("success", `${type === 1 ? "Short Edit SuccessFully" : "Short Edit SuccessFully"}`,);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const deleteShort = (id) => (dispatch) => {
  axios
    .delete(`admin/video/deleteVideo?videoId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.DELETE_SHORT, payload: { id: id } });
        setToast("success", "Short Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};
