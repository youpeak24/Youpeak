import axios from "axios";
import * as ActionType from "./setting.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";
import { baseURL, secretKey } from "../../../util/config";

export const getSettingApi = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/setting?settingId=64d235999aa34a6e0afd19c2`)
    .then((res) => {
      dispatch({ type: ActionType.GET_SETTING_DATA, payload: res.setting });
    })
    .catch((error) => console.error(error));
};

export const editSetting = (id, data) => (dispatch) => {
  axios
    .patch(`admin/setting/update?settingId=${id}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.EDIT_SETTING,
          payload: res.data.setting,
        });
        setToast("success", "Setting Update SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};
export const editWaterMark = (data) => (dispatch) => {
  axios
    .patch(`admin/setting/updateWatermarkSetting`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.EDIT_SETTING,
          payload: res.data.setting,
        });
        setToast("success", "Setting Update SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};



export const switchApi = (id, type, data) => (dispatch) => {
  axios
    .patch(`admin/setting/handleSwitch?settingId=${id}&type=${type}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.SWITCH_SETTING,
          payload: res.data.setting,
        });
        setToast(
          "success",
          `${data === false ? type + " " + "enable " : type + " " + "disable"}`
        );
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const getWithdrawalApi = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/withdraw`)
    .then((res) => {
      dispatch({ type: ActionType.GET_WITHDRAWAL, payload: res.withdraw });
    })
    .catch((error) => console.error(error));
};
export const deleteWithdrawalApi = (withdrawId) => (dispatch) => {
  axios
    .delete(`admin/withdraw/delete?withdrawId=${withdrawId}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.DELETE_WITHDRAW,
          payload: { id: withdrawId },
        });
        setToast("success", "Withdraw Method Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const addPaymentGateway = (formData) => (dispatch) => {
  axios
    .post("admin/withdraw/create", formData)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({
          type: ActionType.ADD_PAYMENT_GATEWAY,
          payload: res.data.withdraw,
        });
        setToast("success", "Payment Gateway Created Successfully !");
      }
    })
    .catch((error) => console.error(error));
};

export const editPaymentGateway = (id, data) => (dispatch) => {
  axios
    .patch(`admin/withdraw/update?withdrawId=${id}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.EDIT_PAYMENT_GATEWAY,
          payload: { data: res.data.withdraw, editDataId: id },
        });
        setToast("success", "Payment Gateway Edit SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const isActivePaymentGetWay = (id, data) => (dispatch) => {
  axios
    .patch(`admin/withdraw/handleSwitch?withdrawId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.ACTIVE_SWITCH_PAYMENT_GATEWAY,
          payload: { editData: res.data.withdraw, editId: id },
        });
        setToast(
          "success",
          data === true ? "Active SuccessFully" : "Disable SuccessFully"
        );
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const getAdsApi = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/advertise`)
    .then((res) => {
      dispatch({ type: ActionType.GET_ADS_DATA, payload: res?.advertise });
    })
    .catch((error) => console.error(error));
};

export const isAdsChange = (data, id) => (dispatch) => {
  axios
    .patch(`admin/advertise/handleSwitchForAd?adId=${id}`)
    .then((res) => {
      if (res) {
        dispatch({
          type: ActionType.IS_ADS_CHANGE,
          payload: res?.data?.advertise,
        });
        setToast(
          "success",
          data === true
            ? "GoogleAds Disable SuccessFully"
            : "GoogleAds Active SuccessFully"
        );
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const adsApiData = (data, id) => (dispatch) => {
  apiInstanceFetch
    .patch(`admin/advertise/update?adId=${id}`, data)
    .then((res) => {
      if (res) {
        dispatch({
          type: ActionType.ADS_API_DATA,
          payload: res?.advertise,
        });
        setToast("success", "Google Ads Update Successfully");
      }
    })
    .catch((error) => console.error(error));
};

export const getAdsReward = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/adRewardCoin/getAdReward`)
    .then((res) => {
      dispatch({ type: ActionType.GET_ADS_REWARD, payload: res?.data });
    })
    .catch((error) => console.error(error));
};

export const addAdsReward = (data) => (dispatch) => {
  axios
    .post(`admin/adRewardCoin/storeAdReward`, data)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({ type: ActionType.ADD_ADS_REWARD, payload: res?.data.data });
        setToast("success", "Reward Coin Add SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const updateReward = (data, id) => (dispatch) => {
  axios
    .patch(`admin/adRewardCoin/updateAdReward`, data)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({
          type: ActionType.EDIT_ADS_REWARD,
          payload: { data: res?.data.data, rewardId: id },
        });
        setToast("success", "Reward Coin Update SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const deleteReward = (id) => (dispatch) => {
  axios
    .delete(`admin/adRewardCoin/deleteAdReward?adRewardId=${id}`)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({ type: ActionType.DELETE_ADS_REWARD, payload: id });
        setToast("success", "Reward Coin Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const getDailyReward = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/dailyRewardCoin/getDailyReward`)
    .then((res) => {
      dispatch({ type: ActionType.GET_DAILY_REWARD, payload: res?.data });
    })
    .catch((error) => console.error(error));
};

export const addDailyReward = (data) => (dispatch) => {
  axios
    .post(`admin/dailyRewardCoin/storeDailyReward`, data)
    .then((res) => {
      if (res.data.status === true) {
        dispatch({
          type: ActionType.ADD_DAILY_REWARD,
          payload: res?.data.data,
        });
        setToast("success", "Daily Reward Add SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const updateDailyReward = (data, id) => (dispatch) => {
  axios
    .patch(`admin/dailyRewardCoin/updateDailyReward`, data)
    .then((res) => {

      if (res.data.status === true) {

        dispatch({
          type: ActionType.EDIT_DAILY_REWARD,
          payload: { data: res?.data.data, id: id },
        });
        setToast("success", "Daily Reward Update SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const deleteDailyReward = (id) => (dispatch) => {
  axios
    .delete(`admin/dailyRewardCoin/deleteDailyReward?dailyRewardCoinId=${id}`)
    .then((res) => {
      if (res.data.status === true) {
        setToast("success", "Daily Reward Delete SuccessFully");
        dispatch({ type: ActionType.DELETE_DAILY_REWARD, payload: id });
      }
      else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.error(error));
};

export const StorageSetting = (payload) => (dispatch) => {

  axios
    .patch(`admin/setting/switchStorageOption?settingId=${payload.settingId}&type=${payload.type}`)
    .then((res) => {

      if (res.data.status) {
        setToast("success", res.data.message);
        dispatch(getSettingApi());
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log("error", error.message));
};

export const fetchAppLinks = () => (dispatch) => {
  dispatch({ type: ActionType.FETCH_APP_LINKS });

  return fetch(`${baseURL}admin/setting/retrieveLinks`, {
    headers: {
      key: secretKey,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response?.json())
    .then((data) => {
      if (data?.status && data?.data) {
        dispatch({
          type: ActionType?.FETCH_APP_LINKS_SUCCESS,
          payload: data.data,
        });
      } else {
        dispatch({ type: ActionType?.FETCH_APP_LINKS_FAILURE });
      }
    })
    .catch(() => {
      dispatch({ type: ActionType?.FETCH_APP_LINKS_FAILURE });
    });
};


