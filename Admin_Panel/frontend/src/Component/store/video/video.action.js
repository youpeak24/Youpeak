import axios from "axios";
import * as ActionType from "./video.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

export const getVideoApi =
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
        .get(
          `admin/video/videosOrShorts?${params.toString()}`
        )
        .then((res) => {
          dispatch({
            type: ActionType.GET_VIDEO,
            payload: {
              video: res.videosOrShorts,
              totalVideo: res.totalVideosOrShorts,
            },
          });
        })
        .catch((error) => console.error(error));
    };

export const getFakeUserName = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/user/getUsersAddByAdminForChannel`)
    .then((res) => {
      dispatch({
        type: ActionType.GET_FAKE_USER_NAME,
        payload: res.users,
      });
    })
    .catch((error) => console.error(error));
};

export const createVideo = (formData) => (dispatch) => {
  axios
    .post("admin/video/uploadVideo", formData)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.IMPORT_VIDEO,
          payload: res.data.video,
        });
        setToast("success", "Video created Successfully !");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const editVideo =
  (data, videoId, userId, channelIdFind, type, fullNameUser) => (dispatch) => {
    axios
      .patch(
        `admin/video/updateVideo?videoId=${videoId}&userId=${userId}&channelId=${channelIdFind}&videoType=${type}`,
        data
      )
      .then((res) => {
        if (res.data.status) {
          dispatch({
            type: ActionType.EDIT_VIDEO,
            payload: {
              data: res.data.video,
              videoId: videoId,
              fullName: fullNameUser,
            },
          });
          setToast(
            "success",
            `${type === 1 ? "Video Edit SuccessFully" : "Short Edit SuccessFully"
            }`
          );
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((error) => console.log("error", error.message));
  };

export const deleteVideo = (id) => (dispatch) => {
  axios
    .delete(`admin/video/deleteVideo?videoId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.DELETE_VIDEO, payload: { id: id } });
        setToast("success", "Video Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};

export const getCommentsApi =
  (start, limit, startDate, endDate, type, search = "") => (dispatch) => {
    apiInstanceFetch
      .get(
        `admin/VideoComment/commentsOfVideos?start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&videoType=${type}&search=${search || ""}`
      )
      .then((res) => {
        dispatch({
          type: ActionType.COMMENT_GET,
          payload: {
            videoComments: res.commentsOfVideos,
            totalVideoComment: res.totalComments,
          },
        });
      })
      .catch((error) => console.error(error));
  };

export const deleteVideoComments = (id) => (dispatch) => {
  axios
    .delete(`admin/videoComment/deleteVideoComment?videoCommentId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.DELETE_VIDEO_COMMENTS,
          payload: { id: id },
        });
        setToast("success", "Comment Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};
