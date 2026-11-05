import * as ActionType from "./withdraw.type";

const initialState = {
  withdraw: [],
  total: 0,
  withdrawType: null,
};

export const withdrawReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_WITHDRAW_REQUEST:
      return {
        ...state,
        withdraw: action.payload.request,
        total: action.payload.total,
        withdrawType: action.payload.type,
      };
    case ActionType.ACCEPT_WITHDRAW_REQUEST: {
      // requestId can be a single string (a single-row action) — .includes()
      // on a string does SUBSTRING matching, not equality, so it can
      // false-match an unrelated row whose _id happens to be a character
      // subsequence of the deleted id. Always compare against a real array.
      const ids = Array.isArray(action.payload.requestId) ? action.payload.requestId : [action.payload.requestId];
      return {
        ...state,
        withdraw: state.withdraw.filter((data) => !ids.includes(data?._id)),
      };
    }
    case ActionType.DECLINE_WITHDRAW_REQUEST: {
      const ids = Array.isArray(action.payload.requestId) ? action.payload.requestId : [action.payload.requestId];
      return {
        ...state,
        withdraw: state.withdraw.filter((data) => !ids.includes(data?._id)),
      };
    }
    default:
      return state;
  }
};
