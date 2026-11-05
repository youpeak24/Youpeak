import axios from "axios";
import * as ActionType from "./currency.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

const token = sessionStorage.getItem("token")

export const getCurrency = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/currency`)
    .then((res) => {
      dispatch({ type: ActionType.GET_CURRENCY_DATA, payload: res.currency });
    })
    .catch((error) => console.error(error));
};
export const getDefaultCurrency = () => (dispatch) => {
  apiInstanceFetch
    .get(`admin/currency/getDefault`, {
      headers : {
        Authorization : token
      }
    })
    .then((res) => {
      dispatch({ type: ActionType.GET_DEFAULT_CURRENCY_DATA, payload: res.currency });
    })
    .catch((error) => console.error(error));
};

export const createCurrency = (data) => (dispatch) => {
  axios
    .post("admin/currency/create", data)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.ADD_CURRENCY, payload: res.data.currency });
        setToast("success", "Contact Added Successfully !");
      }
    })
    .catch((error) => console.error(error));
};

export const updateCurrency = (data, id) => (dispatch) => {

  axios
    .patch(`admin/currency/update?currencyId=${id}`, data)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.UPDATE_CURRENCY,
          payload: { editContact: res.data.currency, id: id },
        });
        setToast("success", "Currency Update Successfully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => setToast("error", error.message));
};

export const deleteCurrency = (id) => (dispatch) => {

  axios
    .delete(`admin/currency/delete?currencyId=${id}`)
    .then((res) => {

      if (res.data.status) {
        dispatch({ type: ActionType.DELETE_CURRENCY, payload: id });
        setToast("success", "Currency Delete SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};

export const isDefaultCurrency = (id) => (dispatch) => {
  axios
    .patch(`admin/currency/default?currencyId=${id}`)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.IS_DEFAULT,
          payload: res.data.allCurrency,
        });
        setToast("success", "Currency Default Set SuccessFully");
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => console.log(error));
};
