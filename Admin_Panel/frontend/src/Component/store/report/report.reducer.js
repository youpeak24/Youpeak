import * as ActionType from "./report.type";

const initialState = {
  videoReport: [],
  totalVideoReport: null,
  videoType: null,
};

export const reportReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_VIDEO_REPORT:
      return {
        ...state,
        videoReport: action.payload.data,
        totalVideoReport: action.payload.totalData,
        videoType: action.payload.videoType,
      };
    case ActionType.DELETE_VIDEO_REPORT:
      return {
        ...state,
        videoReport: state.videoReport.filter((data) => !action.payload.id.includes(data._id)),
      };

    case ActionType.CLEAN_REPORT:
      return {
        ...state,
        videoReport: [],
        totalVideoReport: "",
      };

    default:
      return state;
  }
};