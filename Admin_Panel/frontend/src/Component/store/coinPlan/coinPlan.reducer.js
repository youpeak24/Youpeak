import { ACTIVE_COIN_PLAN, ADD_COIN_PLAN, DELETE_COIN_PLAN, GET_COIN_PLAN, POPULAR_COIN_PLAN, UPDATE_COIN_PLAN } from "./coinPlan.type";

const initialState = {
  coinPlanData: []
};

const coinPlanReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_COIN_PLAN:
      return {
        ...state,
        coinPlanData: action.payload,
      };
    case ADD_COIN_PLAN:
      let data = [...state.coinPlanData];
      data.unshift(action.payload);
      return {
        ...state,
        coinPlanData: data,
      };
    case UPDATE_COIN_PLAN:
      return {
        ...state,
        coinPlanData: state.coinPlanData.map((updatePlan) =>
          updatePlan._id === action.payload.id
            ? action.payload.editPlan
            : updatePlan
        ),
      };
    case ACTIVE_COIN_PLAN:
      const { planId, planActiveData } = action.payload;
      const updatedWithdrawSwitch = state.coinPlanData?.map((item) => {
        if (item?._id === planId) {
          return {
            ...item,
            isActive: planActiveData.isActive,
          };
        }
        return item;
      });
      return {
        ...state,
        coinPlanData: updatedWithdrawSwitch,
      };
    case POPULAR_COIN_PLAN:
      const { planPopularId, planpopularData } = action.payload;
      const updatedWithdrawPopularSwitch = state.coinPlanData?.map((item) => {
        if (item?._id === planPopularId) {
          return {
            ...item,
            isPopular: planpopularData.isPopular,
          };
        }
        return item;
      });
      return {
        ...state,
        coinPlanData: updatedWithdrawPopularSwitch,
      };

    default:
      return state;
  }
};
export default coinPlanReducer;
