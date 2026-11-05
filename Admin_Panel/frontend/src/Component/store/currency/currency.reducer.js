import * as ActionType from "./currency.type";

const initialState = {
  currency: [],
  defaultCurrency:{}
};

export const currencyReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_CURRENCY_DATA:
      
      return {
        currency: action.payload,
      };
    case ActionType.GET_DEFAULT_CURRENCY_DATA:
      return {
        ...state,
        defaultCurrency: action.payload,
      };
    case ActionType.ADD_CURRENCY:
      let data = [...state.currency];
      data.unshift(action.payload);
      return {
        ...state,
        currency: data,
      };
    case ActionType.UPDATE_CURRENCY:
      return {
        ...state,
        currency: state.currency.map((item) =>
          item._id === action.payload.id ? action.payload.editContact : item
        ),
      };
    case ActionType.DELETE_CURRENCY:
      
      return {
        ...state,
        currency: state.currency.filter(
          (data) => !action.payload.includes(data._id)
        ),
      };
    case ActionType.IS_DEFAULT:
      
      return {
        ...state,
        currency: action.payload,
      };

    default:
      return state;
  }
};
