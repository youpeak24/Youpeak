import * as ActionType from "./dashboard.type";

const initialState = {
  dashboard: {},
  dashBoardHost: {},
  dashBoardHostFetch:{},
  revenueChart:[],
  userChart:[],
  dashboardCount:{},
  chartAnalyticOfUsers:[],
  chartAnalyticOfShorts:[],
  chartAnalyticOfVideos:[],
  chartAnalyticOfActiveUser:[]
};

export const dashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_DASHBOARD_USER: {
      // Each dispatch is for exactly one series (User/Video/Short) — only
      // that field should update, otherwise the last chart type to resolve
      // overwrites all three lines with its own data.
      const key =
        action.chartType === "Short"
          ? "chartAnalyticOfShorts"
          : action.chartType === "Video"
          ? "chartAnalyticOfVideos"
          : "chartAnalyticOfUsers";
      return {
        ...state,
        [key]: action.payload || state[key],
      };
    }
      case ActionType.GET_DASHBOARD_ACTIVE_CHART:
      return {
        ...state,
        chartAnalyticOfActiveUser: action.payload
      };
      case ActionType.GET_DASHBOARD_COUNT:
        return {
          ...state,
          dashboardCount: action.payload,
        };
      case ActionType.GET_DASHBOARD_HOST: 
        return {
          ...state,
          dashBoardHost: action.payload,
        };
        case ActionType.GET_DASHBOARD_HOST_FETCH: 
        return {
          ...state,
          dashBoardHostFetch: action.payload,
        };
      case ActionType.GET__USER_CHART: 
      return {
        ...state,
        userChart: action.payload,
      };
      case ActionType.GET_REVENUE_CHART: 
      return {
        ...state,
        revenueChart: action.payload,
      };
    default:
      return state;
  }
};
