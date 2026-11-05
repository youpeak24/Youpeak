import * as ActionType from "./premiumPlan.type";

const initialState = {
    premiumPlanData:[]
  };

  export const premiumPlanReducer = (state = initialState, action) => {
    switch (action.type) {
      case ActionType.GET_PREMIUM_PLAN:
        return {
          ...state,
          premiumPlanData: action.payload,
        };
        case ActionType.ADD_PREMIUM_PLAN:
          let data = [...state.premiumPlanData];
          data.unshift(action.payload);
          return {
            ...state,
            premiumPlanData: data,
          };
          case ActionType.UPDATE_PREMIUM_PLAN:
            return {
              ...state,
              premiumPlanData: state.premiumPlanData.map((updatePlan) =>
              updatePlan._id === action.payload.id
                  ? action.payload.editPlan
                  : updatePlan
              ),
            };
            case ActionType.ACTIVE_PREMIUM_PLAN:
              const { planId, planActiveData } = action.payload;
              const updatedWithdrawSwitch = state.premiumPlanData?.map((item) => {
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
                premiumPlanData: updatedWithdrawSwitch,
              };
              case ActionType.DELETE_PREMIUM_PLAN:
                return {
                  ...state,
                  premiumPlanData: state.premiumPlanData.filter(
                    (data) => !action.payload.includes(data._id)
                  ),
                };
      default:
        return state;
    }
  };

 