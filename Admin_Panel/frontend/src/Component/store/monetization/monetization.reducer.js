import * as ActionType from "./monetization.type";

const initialState = {
  monetization: [],
  total: 0,
  monetizationType: null,
};

export const monetizationReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_MONETIZATION_REQUEST:
      return {
        ...state,
        monetization: action.payload.request,
        total: action.payload.total,
        monetizationType: action.payload.type,
      };
   
      case ActionType.ACCEPT_MONETIZATION_REQUEST: {
        // requestId is typically a single string here — .includes() on a
        // string does substring matching, not equality, and could
        // false-match an unrelated row. Always compare against a real array.
        const ids = Array.isArray(action.payload.requestId) ? action.payload.requestId : [action.payload.requestId];
        return {
          ...state,
          monetization: state.monetization.filter((data) => !ids.includes(data._id)),
        };
      }
    default:
      return state;
  }
};
