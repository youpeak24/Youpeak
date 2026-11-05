import { secretKey } from "../../../util/config";
import { SetDevKey, setToken } from "../../../util/setAuth";
import * as ActionType from "./admin.type";
import jwt_decode from "jwt-decode";

const initialState = {
  admin: {},
  isAuth: false,
  // shared earnings (existing tabs)
  earning: [],
  total: 0,
  totalEarning: 0,
  // all plan earnings (new tab)
  allPlanEarning: [],
  allPlanTotal: 0,
  allPlanTotalEarning: 0,
  allPlanLoading: false,
  allPlanError: null,
};

export const adminReducer = (state = initialState, action) => {
  let decode;
  switch (action.type) {
    case ActionType.LOGIN_ADMIN:
      if (action.payload) {
        decode = jwt_decode(action.payload);
      }
      // Set Token And Key In Axios
      setToken(action?.payload);
      SetDevKey(secretKey);
      // Set Token And Key In Session
      sessionStorage.setItem("token", action?.payload);
      sessionStorage.setItem("key", secretKey);
      sessionStorage.setItem("isAuth", true);
      sessionStorage.setItem("admin", JSON.stringify(decode));
      return {
        ...state,
        admin: decode || JSON.parse(sessionStorage.getItem("admin")),
        isAuth: true,
      };
    case ActionType.LOGOUT_ADMIN:
      window.sessionStorage.clear();

      setToken(null);
      SetDevKey(null);
      return {
        ...state,
        admin: {},
        isAuth: false,
      };

    case ActionType.UPDATE_PROFILE:
      return {
        ...state,
        admin: {
          ...state.admin,
          _id: action.payload._id,
          name: action.payload.name,
          email: action.payload.email,
          image: action.payload.image,
          flag: action.payload.flag,
          password: action.payload.password,
        },
      };
    case ActionType.ADMIN_EARNING:
      return {
        ...state,
        earning: action.payload.earning,
        total: action.payload.total,
        totalEarning: action.payload.totalEarning,
      };
    case ActionType.COIN_PLAN_EARNING:
      return {
        ...state,
        earning: action.payload.earning,
        total: action.payload.total,
        totalEarning: action.payload.totalEarning,
      };
    case ActionType.LOGOUT_ADMIN:
      sessionStorage.removeItem("key", secretKey);
      sessionStorage.removeItem("token", setToken);
      sessionStorage.removeItem("isAuth", false);
      setToken(null);
      SetDevKey(null);

    case ActionType.CLEAN_EARNING:
      return {
        ...state,
        earning: [],
        total: "",
        totalEarning: "",
      };

    // All plan earnings (user coin + VIP history)
    case ActionType.ALL_PLAN_EARNING_REQUEST:
      return {
        ...state,
        allPlanLoading: true,
        allPlanError: null,
      };
    case ActionType.ALL_PLAN_EARNING_SUCCESS:
      return {
        ...state,
        allPlanLoading: false,
        allPlanEarning: action.payload.earning,
        allPlanTotal: action.payload.total,
        allPlanTotalEarning: action.payload.totalEarning,
      };
    case ActionType.ALL_PLAN_EARNING_FAILURE:
      return {
        ...state,
        allPlanLoading: false,
        allPlanError: action.payload,
      };
    case ActionType.CLEAN_ALL_PLAN_EARNING:
      return {
        ...state,
        allPlanEarning: [],
        allPlanTotal: 0,
        allPlanTotalEarning: 0,
        allPlanLoading: false,
        allPlanError: null,
      };


      return {
        ...state,
        admin: {},
        isAuth: false,
      };
    default:
      return state;
  }
};
