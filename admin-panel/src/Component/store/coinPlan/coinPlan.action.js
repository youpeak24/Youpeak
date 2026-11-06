import axios from "axios";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";
import { ACTIVE_COIN_PLAN, ADD_COIN_PLAN, DELETE_COIN_PLAN, GET_COIN_PLAN, POPULAR_COIN_PLAN, UPDATE_COIN_PLAN } from "./coinPlan.type";

const COIN_PLAN_PAYMENT_GATEWAY_FILTER_KEY = "coinPlanPaymentGatewayFilter";

export const getCoinPlan = (paymentGateway) => (dispatch) => {
    const effectiveGateway =
        paymentGateway ?? sessionStorage.getItem(COIN_PLAN_PAYMENT_GATEWAY_FILTER_KEY) ?? "All";

    if (paymentGateway !== undefined) {
        sessionStorage.setItem(COIN_PLAN_PAYMENT_GATEWAY_FILTER_KEY, effectiveGateway);
    }

    const paymentGatewayQuery =
        effectiveGateway && effectiveGateway !== "All"
            ? `?paymentGateway=${encodeURIComponent(effectiveGateway)}`
            : "";

    apiInstanceFetch
        .get(`admin/coinplan/fetchCoinplan${paymentGatewayQuery}`)
        .then((data) => {
            dispatch({ type: GET_COIN_PLAN, payload: data.data }); // Adjust based on the actual structure
        })
        .catch((error) => console.error("Error fetching coin plans:", error));
};


export const addCoinPlan = (formData) => (dispatch) => {
    axios
        .post("admin/coinplan/store", formData)
        .then((res) => {
            if (res.data.status) {
                dispatch({ type: ADD_COIN_PLAN, payload: res.data.data });
                dispatch(getCoinPlan())
                setToast("success", "Coin Added Successfully !");
            }
        })
        .catch((error) => console.error(error));
};

export const updateCoinPlan = (formData, id) => (dispatch) => {
    axios
        .patch(`admin/coinplan/update?coinPlanId=${id}`, formData)
        .then((res) => {
            if (res.data.status) {
                dispatch({
                    type: UPDATE_COIN_PLAN,
                    payload: { editPlan: res.data.data, id: id },
                });
                dispatch(getCoinPlan())
                setToast("success", "Coin Update Successfully");
            } else {
                setToast("error", res.data.message);
            }
        })
        .catch((error) => setToast("error", error.message));
};

export const isActiveCoinPlan = (id, data) => (dispatch) => {
    axios
        .patch(`admin/coinplan/handleisActiveSwitch?coinPlanId=${id}`)
        .then((res) => {
            if (res.data.status) {
                dispatch({
                    type: ACTIVE_COIN_PLAN,
                    payload: { planId: id, planActiveData: res.data.data },
                });
                dispatch(getCoinPlan())
                setToast(
                    "success",
                    data === true ? "Coin Plan Active SuccessFully" : "Coin Plan Disable SuccessFully"
                )
            } else {
                setToast("error", res.data.message);
            }
        })
        .catch((error) => console.log("error", error.message));
};
export const isPopularCoinPlan = (id, data) => (dispatch) => {
    axios
        .patch(`admin/coinplan/handleisPopularSwitch?coinPlanId=${id}`)
        .then((res) => {
            if (res.data.status) {
                dispatch({
                    type: POPULAR_COIN_PLAN,
                    payload: { planPopularId: id, planpopularData: res.data.data },
                });
                dispatch(getCoinPlan())
                setToast(
                    "success",
                    data === true ? "Coin Plan Popular SuccessFully" : "Coin Plan Unpopular SuccessFully"
                )
            } else {
                setToast("error", res.data.message);
            }
        })
        .catch((error) => console.log("error", error.message));
};

