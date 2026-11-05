import * as ActionType from "./setting.type";

const initialState = {
  settingData: {},
  withdrawData: [],
  rewardData: [],
  dailyReward: [],
  adsData: {},
  appLinks: {
    websiteUrl: "",
    androidAppLink: "",
    iosAppLink: "",
  },
};

export const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_SETTING_DATA:
      return {
        ...state,
        settingData: action.payload,
      };
    case ActionType.EDIT_SETTING:
      return {
        ...state,
        settingData: action.payload,
      };
    case ActionType.SWITCH_SETTING:
      return {
        ...state,
        settingData: action.payload,
      };
    case ActionType.GET_WITHDRAWAL:
      return {
        ...state,
        withdrawData: action.payload,
      };

    case ActionType.ADD_PAYMENT_GATEWAY:
      let paymentAdd = [...state.withdrawData];
      paymentAdd.unshift(action.payload);
      return {
        ...state,
        withdrawData: paymentAdd,
      };
    case ActionType.ACTIVE_SWITCH_PAYMENT_GATEWAY:
      const { editId, editData } = action.payload;
      const updatedWithdrawSwitch = state.withdrawData?.map((item) => {
        if (item?._id === editId) {
          return {
            ...item,
            isEnabled: editData.isEnabled,
          };
        }
        return item;
      });
      return {
        ...state,
        withdrawData: updatedWithdrawSwitch,
      };
    case ActionType.DELETE_WITHDRAW:
      return {
        ...state,
        withdrawData: state.withdrawData.filter(
          (data) => !action?.payload?.id.includes(data?._id)
        ),
      };
    case ActionType.EDIT_PAYMENT_GATEWAY:
      const { data, editDataId } = action.payload;
      const updatedWithdraw = state.withdrawData?.map((item) => {
        if (item?._id === editDataId) {
          return {
            ...item,
            ...data,
          };
        }
        return item;
      });
      return {
        ...state,
        withdrawData: updatedWithdraw,
      };
    case ActionType.GET_ADS_DATA:
      return {
        ...state,
        adsData: action.payload,
      };
    case ActionType.IS_ADS_CHANGE:
      return {
        ...state,
        adsData: action.payload,
      };
    case ActionType.ADS_API_DATA:
      return {
        ...state,
        adsData: action.payload,
      };

    case ActionType.GET_ADS_REWARD:
      return {
        ...state,
        rewardData: action.payload,
      };

    case ActionType.ADD_ADS_REWARD:
      let rewardAdd = [...state.rewardData];
      rewardAdd.unshift(action.payload);
      return {
        ...state,
        rewardData: rewardAdd,
      };

    case ActionType.EDIT_ADS_REWARD:
      
      const updatedReward = state.rewardData?.map((item) => {
        if (item?._id === action.payload.rewardId) {
          return {
            ...item,
            ...action.payload.data,
          };
        }
        return item;
      });
      return {
        ...state,
        rewardData: updatedReward,
      };
    case ActionType.DELETE_ADS_REWARD:
      return {
        ...state,
        rewardData: state.rewardData.filter(
          (data) => !action?.payload.includes(data?._id)
        ),
      };

    case ActionType.GET_DAILY_REWARD:
      return {
        ...state,
        dailyReward: action.payload,
      };

    case ActionType.ADD_DAILY_REWARD:
      let dailyRewardAdd = [...state.dailyReward];
      dailyRewardAdd.unshift(action.payload);
      return {
        ...state,
        dailyReward: dailyRewardAdd,
      };

    case ActionType.EDIT_DAILY_REWARD:
      const updatedDailyReward = state.dailyReward?.map((item) => {
        if (item?._id === action.payload.id) {
          return {
            ...item,
            ...action.payload.data,
          };
        }
        return item;
      });
      return {
        ...state,
        dailyReward: updatedDailyReward,
      };

    case ActionType.DELETE_DAILY_REWARD:
      return {
        ...state,
        dailyReward: state.dailyReward.filter(
          (data) => !action?.payload.includes(data?._id)
        ),
      };

    case ActionType.FETCH_APP_LINKS_SUCCESS:
      return {
        ...state,
        appLinks: action?.payload,
      };

    default:
      return state;
  }
};
