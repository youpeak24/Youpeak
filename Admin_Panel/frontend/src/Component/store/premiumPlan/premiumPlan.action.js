import axios from "axios";
import * as ActionType from "./premiumPlan.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";

const PREMIUM_PLAN_PAYMENT_GATEWAY_FILTER_KEY = "premiumPlanPaymentGatewayFilter";

export const getPremiumPlan = (paymentGateway) => (dispatch) => {
  const effectiveGateway =
    paymentGateway ??
    sessionStorage.getItem(PREMIUM_PLAN_PAYMENT_GATEWAY_FILTER_KEY) ??
    "All";

  if (paymentGateway !== undefined) {
    sessionStorage.setItem(PREMIUM_PLAN_PAYMENT_GATEWAY_FILTER_KEY, effectiveGateway);
  }

  const paymentGatewayQuery =
    effectiveGateway && effectiveGateway !== "All"
      ? `?paymentGateway=${encodeURIComponent(effectiveGateway)}`
      : "";

  apiInstanceFetch
      .get(`admin/premiumPlan${paymentGatewayQuery}`)
      .then((res) => {
        dispatch({ type: ActionType.GET_PREMIUM_PLAN, payload:res.premiumPlan});
      })
      .catch((error) => console.error(error));
  };
  
  export const addPremiumPlan = (formData) => (dispatch) => {
    axios
      .post("admin/premiumPlan/create", formData)
      .then((res) => {
        if (res.data.status) {
          dispatch({ type: ActionType.ADD_PREMIUM_PLAN, payload:res.data.premiumPlan });
          setToast("success", "Plan Added Successfully !");
        }
      })
      .catch((error) => console.error(error));
  };
  
  export const updatePremiumPlan = (formData, id) => (dispatch) => {
    axios
      .patch(`admin/premiumPlan/update?premiumPlanId=${id}`, formData)
      .then((res) => {
        if (res.data.status) {
          dispatch({
            type: ActionType.UPDATE_PREMIUM_PLAN,
            payload: { editPlan: res.data.premiumPlan, id:id },
          });
          setToast("success", "Plan Update Successfully");
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((error) => setToast("error", error.message));
  };

  export const isActivePremiumPlan = (id,data) => (dispatch) => {
    axios
      .patch(`admin/premiumPlan/handleisActive?premiumPlanId=${id}`)
      .then((res) => {
        if (res.data.status) {
          dispatch({
            type: ActionType.ACTIVE_PREMIUM_PLAN,
            payload: {planActiveData:res.data.premiumPlan,planId:id} ,
          });
          setToast(
            "success",
            data === true ? "Plan Active SuccessFully" :"Plan Disable SuccessFully"
            )
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((error) => console.log("error", error.message));
  };
  
  export const deletePlan = (id) => (dispatch) => {
    axios
      .delete(`admin/premiumPlan/delete?premiumPlanId=${id}`)
      .then((res) => {
        if (res.data.status) {
          dispatch({ type: ActionType.DELETE_PREMIUM_PLAN, payload:id});
          setToast("success","Plan Delete SuccessFully");
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((error) => console.log(error));
  };