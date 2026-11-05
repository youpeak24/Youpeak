import * as ActionType from "./user.type";

const initialState = {
  user: [],
  totalUser: null,
  userDetails: {},
  history: [],
  userProfile: {},
  totalCoin: null,
  countryData: [],
  ipAddressData: null,
  fakeUser: [],
  totalUsersAddByAdmin: null,
  getUserChannel: [],
  totalUserChannel: null,
  getFakeUserData: [],
  totalFakeUserData: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_USER:
      return {
        ...state,
        user: action.payload.user,
        totalUser: action.payload.totalUser,
      };
    case ActionType.GET_USER_PROFILE:
      return {
        ...state,
        userProfile: action.payload,
      };
    case ActionType.GET_IP_ADDRESS:
      return {
        ...state,
        ipAddressData: action.payload,
      };

    case ActionType.USER_EDIT_PROFILE:
      const updatedFakeUser = state.fakeUser?.map((item) => {
        if (item?._id === action.payload.id) {
          return {
            ...item,
            fullName: action.payload.data.fullName,
            ipAddress: action.payload.data.ipAddress,
            image: action.payload.data.image,
          };
        }
        return item;
      });
      const userUpdate = state.user?.map((item) => {
        if (item?._id === action.payload.id) {
          return {
            ...item,
            fullName: action.payload.data.fullName,
            image: action.payload.data.image,
          };
        }
        return item;
      });
      return {
        ...state,
        userProfile: action.payload.data,
        fakeUser: updatedFakeUser,
        user: userUpdate,
      };
    case ActionType.PAASWORD_CHANGE_API:
      return {
        ...state,
        userProfile: action.payload.data,
      };
    case ActionType.ACTIVE_SWITCH_USER: {
      const userIds = Array.isArray(action.payload.id)
        ? action.payload.id
        : action.payload.id != null
        ? [action.payload.id]
        : [];
      const updatedUsers = Array.isArray(action.payload.data)
        ? action.payload.data
        : action.payload.data
        ? [action.payload.data]
        : [];

      // Merges the FULL updated user object back into the list, not just
      // isBlock — this action is reused by togglePaymentStatus (which
      // never touches isBlock at all), so a hard-coded isBlock-only merge
      // silently dropped every paymentStatus update: the toggle switch
      // would visually reset because the state it read from was never
      // patched.
      const applyUserPatch = (list) =>
        list.map((data) => {
          if (!userIds.includes(data._id)) return data;
          const matchingUserData = updatedUsers.find(
            (user) => user._id === data._id
          );
          if (!matchingUserData) return data;
          return {
            ...data,
            ...matchingUserData,
          };
        });

      return {
        ...state,
        user:
          action.payload.type === "user"
            ? applyUserPatch(state.user)
            : state.user,
        fakeUser:
          action.payload.type === "fakeUser"
            ? applyUserPatch(state.fakeUser)
            : state.fakeUser,
      };
    }
    case ActionType.DELETE_USER:
      if (action.payload.type === "user") {
        return {
          ...state,
          user: state.user.filter(
            (data) => !action.payload.id.includes(data._id)
          ),
        };
      } else if (action.payload.type === "fakeUser") {
        return {
          ...state,
          fakeUser: state.fakeUser.filter(
            (data) => !action.payload.id.includes(data._id)
          ),
        };
      }
    case ActionType.GET_FAKE_USER:
      return {
        ...state,
        fakeUser: action.payload.data,
        totalUsersAddByAdmin: action.payload.total,
      };
    case ActionType.CREATE_FAKE_USER:
      let data = [...state.fakeUser];
      data.unshift(action.payload);
      return {
        ...state,
        fakeUser: data,
      };
    case ActionType.CREATE_FAKE_USER_CHANNEL:
      const { id, channelData } = action.payload;
      const updatedFakeUserChannel = state.fakeUser?.map((item) => {
        if (item?._id === id) {
          return {
            ...item,
            isChannel: channelData.isChannel,
            fullName: channelData.fullName,
          };
        }
        return item;
      });
      return {
        ...state,
        fakeUser: updatedFakeUserChannel,
      };
    case ActionType.GET_USER_CHANNEL_DATA:
      return {
        ...state,
        getUserChannel: action.payload.channel,
        totalUserChannel: action.payload.total,
      };
    case ActionType.GET_FAKE_USER_CHANNEL_DATA:
      return {
        ...state,
        getFakeUserData: action.payload.channel,
        totalFakeUserData: action.payload.total,
      };
    case ActionType.GET_FAKE_USER_NAME:
      return {
        ...state,
        getFakeUserData: action.payload,
      };

    case ActionType.DELETE_CHANEL:
      return {
        ...state,
        getUserChannel: state.getUserChannel.filter(
          (data) => data?.channelId !== action?.payload?.id
        ),
        getFakeUserData: state.getFakeUserData.filter(
          (data) => data?.channelId !== action?.payload?.id
        ),
      };

    case ActionType.CLEAN_USER:
      return {
        ...state,
        getUserChannel: [],
        totalUserChannel: "",
      };



    default:
      return state;
  }
};
