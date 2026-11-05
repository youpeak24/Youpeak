import axios from "axios";
import * as ActionType from "./admin.type";
import { setToast } from "../../../util/toast";
import { apiInstanceFetch } from "../../../util/api";
import { describeApiError } from "../../../util/apiError";

const token = sessionStorage.getItem("token");

export const signupAdmin = (signup, navigate) => (dispatch) => {
  axios
    .post("admin/admin/create", signup)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.SIGNUP_ADMIN });
        setToast("success", "Signup Successfully!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 200);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => {
      setToast("error", error);
    });
};

export const updateCode = (signup) => (dispatch) => {
  axios
    .patch("admin/admin/updateCode", signup)
    .then((res) => {
      if (res.data.status) {
        setToast("success", "Purchase Code Update Successfully!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => {
      setToast("error", error);
    });
};

export const loginAdmin = (login, navigate, onFinish) => async (dispatch) => {
  axios
    .post("admin/admin/login", login)
    .then((res) => {
      if (res.data.status) {
        dispatch({ type: ActionType.LOGIN_ADMIN, payload: res.data.token });
        if (res.data.admin) {
          sessionStorage.setItem("admin", JSON.stringify(res.data.admin));
        }
        setToast("success", "Login Successfully!");
        setTimeout(() => {
          if (res.data.admin?.role === "AGENCY_ADMIN") {
            navigate("/admin/agencyDashboard");
          } else if (res.data.admin?.role === "DIGITAL_PARTNER_ADMIN") {
            navigate("/admin/partnerDashboard");
          } else {
            navigate("/admin/mainDashboard");
          }
        }, 100);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => {
      setToast("error", describeApiError(error, "Login failed"));
    })
    .finally(() => {
      if (onFinish) onFinish();
    });
};

export const getProfile = () => (dispatch) => {
  axios
    .get("admin/admin/profile", {
      Headers: {
        authorization: token,
      },
    })
    .then((res) => {
      if (res.status) {
        dispatch({ type: ActionType.UPDATE_PROFILE, payload: res.data.user });
      } else {
        setToast("error", res.message);
      }
    })
    .catch((error) => {
      console.log("error", error.message);
    });
};

export const changePassword = (data) => (dispatch) => {
  axios
    .patch(`admin/admin/updatePassword`, data)
    .then((res) => {
      if (res.data.status) {
        setToast("success", "Password Changed Successfully.");
        setTimeout(() => {
          dispatch({ type: ActionType.UNSET_ADMIN });
          window.location.href = "/login";
        }, [3000]);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => setToast("error", error.message));
};

export const profileUpdate = (formData) => (dispatch) => {
  axios
    .patch("admin/admin/updateProfile", formData)
    .then((res) => {
      if (res.data.status) {
        dispatch({
          type: ActionType.UPDATE_PROFILE,
          payload: res.data.admin,
        });
        setToast("success", "Admin update Successfully");
      }
    })
    .catch((error) => {
      setToast("error", error);
    });
};

export const sendEmail = (login) => (dispatch) => {
  axios
    .post("admin/admin/forgotPassword", login)
    .then((res) => {
      if (res.data.status) {
        setToast("success", "Email Send For Forget The Password! ");
        setTimeout(() => {
          window.location.href = "/";
        }, [2000]);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => {
      setToast("error", error.response.data.message);
    });
};

export const setPasswordApi = (login) => (dispatch) => {
  axios
    .post(`admin/admin/setPassword`, login)
    .then((res) => {
      if (res.data.status) {
        setToast("success", "Password Changed Successfully.");
        setTimeout(() => {
          window.location.href = "/";
        }, [2000]);
      } else {
        setToast("error", res.data.message);
      }
    })
    .catch((error) => {
      setToast("error", error.response.data.message);
    });
};

export const getAdminEarnings =
  (startDate, endDate, start, limit, search = "", paymentGateway) =>
    (dispatch) => {
      const normalizedGateway = Array.isArray(paymentGateway)
        ? paymentGateway.filter(Boolean).join(",")
        : paymentGateway;
      const paymentGatewayQuery =
        normalizedGateway && normalizedGateway !== "All"
          ? `&paymentGateway=${encodeURIComponent(normalizedGateway)}`
          : "";

      apiInstanceFetch
        .get(
          `admin/premiumPlan/getpremiumPlanHistory?startDate=${startDate}&endDate=${endDate}&start=${start}&limit=${limit}&search=${encodeURIComponent(
            search || ""
          )}${paymentGatewayQuery}`
        )
        .then((res) => {
          if (res.status) {
            dispatch({
              type: ActionType.ADMIN_EARNING,
              payload: {
                earning: res.history,
                total: res.totalHistory,
                totalEarning: res.totalAdminEarnings,
              },
            });
          }
        });
    };

export const cleanData = () => (dispatch) => {
  dispatch({ type: ActionType.CLEAN_EARNING });
};

export const getCoinPlanEarnings =
  (startDate, endDate, start, limit, search = "", paymentGateway) =>
    (dispatch) => {
      const normalizedGateway = Array.isArray(paymentGateway)
        ? paymentGateway.filter(Boolean).join(",")
        : paymentGateway;
      const paymentGatewayQuery =
        normalizedGateway && normalizedGateway !== "All"
          ? `&paymentGateway=${encodeURIComponent(normalizedGateway)}`
          : "";

      apiInstanceFetch
        .get(
          `admin/coinPlan/retrieveUserCoinplanRecords?startDate=${startDate}&endDate=${endDate}&start=${start}&limit=${limit}&search=${encodeURIComponent(
            search || ""
          )}${paymentGatewayQuery}`
        )
        .then((res) => {
          if (res.status) {
            dispatch({
              type: ActionType.COIN_PLAN_EARNING,
              payload: {
                earning: res.data,
                total: res.total,
                totalEarning: res.totalAdminEarnings,
              },
            });
          }
        });
    };

// All plan earnings (user coin + VIP history)
export const getAllPlanEarnings =
  (startDate, endDate, start, limit, search = "", paymentGateway) =>
    (dispatch) => {
      dispatch({ type: ActionType.ALL_PLAN_EARNING_REQUEST });

      const normalizedGateway = Array.isArray(paymentGateway)
        ? paymentGateway.filter(Boolean).join(",")
        : paymentGateway;
      const paymentGatewayQuery =
        normalizedGateway && normalizedGateway !== "All"
          ? `&paymentGateway=${encodeURIComponent(normalizedGateway)}`
          : "";

      const url = `admin/user/fetchUserCoinVipHistory?startDate=${startDate}&endDate=${endDate}&start=${start}&limit=${limit}&search=${encodeURIComponent(
        search || ""
      )}${paymentGatewayQuery}`;

      apiInstanceFetch
        .get(url)
        .then((res) => {
          if (res.status) {
            const earning = res.data || res.history || [];
            const total = res.total || res.totalHistory || 0;
            const totalEarning =
              res.totalAdminEarnings || res.totalEarning || 0;

            dispatch({
              type: ActionType.ALL_PLAN_EARNING_SUCCESS,
              payload: {
                earning,
                total,
                totalEarning,
              },
            });
          } else {
            dispatch({
              type: ActionType.ALL_PLAN_EARNING_FAILURE,
              payload: res.message || "Failed to fetch all plan earnings",
            });
          }
        })
        .catch((error) => {
          dispatch({
            type: ActionType.ALL_PLAN_EARNING_FAILURE,
            payload: error.message || "Failed to fetch all plan earnings",
          });
        });
    };

export const cleanAllPlanEarning = () => (dispatch) => {
  dispatch({ type: ActionType.CLEAN_ALL_PLAN_EARNING });
};
