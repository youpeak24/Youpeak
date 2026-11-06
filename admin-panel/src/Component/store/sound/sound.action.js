import axios from "axios";
import * as ActionType from "./sound.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

export const getSoundCategory =
  (start = 1, limit = 20, startDate = "All", endDate = "All", search = "") =>
    (dispatch) => {
      apiInstanceFetch
        .get(
          `admin/soundCategory?start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search || ""}`
        )
        .then((res) => {
          // Backward compatible:
          // - old API: { soundCategory: [...] }
          // - new API: { soundCategory: [...], totalSoundCategory: number } (or similar)
          dispatch({
            type: ActionType.GET_SOUND_CATEGORY,
            payload: {
              soundCategory: res.soundCategory || [],
              totalSoundCategory:
                res.totalSoundCategory ??
                res.totalSoundCategories ??
                res.total ??
                res.totalCategory ??
                0,
            },
          });
        })
        .catch((error) => console.error(error));
    };

export const addSoundCategory = (formData) => (dispatch) => {
  axios
    .post("admin/soundCategory/create", formData)
    .then((res) => {

      if (res.data.status === true) {
        dispatch({ type: ActionType.SOUND_CATEGORY_ADD, payload: res.data.soundCategory });
        setToast("success", "Sound Category Created Successfully !");
      }
    })
    .catch((error) => console.error(error));
};

export const editSoundCategory = (id, data) => (dispatch) => {
  axios
    .patch(`admin/soundCategory/update?soundCategoryId=${id}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.SOUND_CATEGORY_EDIT,
          payload: { editData: res.data.soundCategory, id: id },
        });
        setToast("success", "Sound Category Edit SuccessFully",);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const deleteSoundCategory = (id) => (dispatch) => {
  axios
    .delete(`admin/soundCategory/delete?soundCategoryId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.SOUND_CATEGORY_DELETE, payload: { id: id } });
        setToast("success", "Sound Category Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};

export const getSoundList =
  (start = 1, limit = 20, startDate = "All", endDate = "All", search = "") =>
    (dispatch) => {
      apiInstanceFetch
        .get(
          `admin/soundList/getSoundList?start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search || ""}`
        )
        .then((res) => {
          // Backward compatible:
          // - old API: { soundList: [...] }
          // - new API: { soundList: [...], totalSoundList: number } (or similar)
          dispatch({
            type: ActionType.GET_SOUND_LIST,
            payload: {
              soundList: res.soundList || [],
              totalSoundList:
                res.totalSoundList ?? res.totalSounds ?? res.total ?? res.totalSound ?? 0,
            },
          });
        })
        .catch((error) => console.error(error));
    };

export const addSound = (formData) => (dispatch) => {
  axios
    .post("admin/soundList/createSoundList", formData)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({ type: ActionType.SOUND_LIST_ADD, payload: res.data.soundList });
        setToast("success", "Sound Category Created Successfully !");
      }
    })
    .catch((error) => console.error(error));
};

export const editSound = (id, data) => (dispatch) => {
  axios
    .patch(`admin/soundList/updateSoundList?soundListId=${id}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.SOUND_LIST_EDIT,
          payload: { soundEditData: res.data.soundList, soundId: id },
        });
        setToast("success", "Sound Edit SuccessFully",);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const deleteSound = (id) => (dispatch) => {
  axios
    .delete(`admin/soundList/deleteSoundList?soundListId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.SOUND_LIST_DELETE, payload: { id: id } });
        setToast("success", "Sound Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};
