import * as ActionType from "./sound.type";

const initialState = {
  soundCategoryData: [],
  soundListData: [],
  totalSoundList: 0,
  totalSoundCategory: 0,
};

export const soundReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_SOUND_LIST:
      // Supports both:
      // - legacy payload: array
      // - new payload: { soundList: array, totalSoundList: number }
      if (Array.isArray(action.payload)) {
        return {
          ...state,
          soundListData: action.payload,
        };
      }
      return {
        ...state,
        soundListData: action.payload?.soundList || [],
        totalSoundList: action.payload?.totalSoundList ?? 0,
      };
    case ActionType.SOUND_LIST_ADD:
      let listAdd = [...state.soundListData];
      listAdd.unshift(action.payload);
      return {
        ...state,
        soundListData: listAdd,
      };
    case ActionType.SOUND_LIST_DELETE:
      return {
        ...state,
        soundListData: state.soundListData.filter(
          (data) => !action.payload.id.includes(data._id)
        ),
      };
      case ActionType.SOUND_LIST_EDIT:
        const { soundId, soundEditData } = action.payload;
        const updatedSoundData = state.soundListData?.map((item) => {
          if (item?._id === soundId) {
            return {
              ...item,
              ...soundEditData
            };
          }
          return item;
        });
        return {
          ...state,
          soundListData: updatedSoundData,
        };
    case ActionType.GET_SOUND_CATEGORY:
      // Supports both:
      // - legacy payload: { soundCategory: array }
      // - new payload: { soundCategory: array, totalSoundCategory: number }
      return {
        ...state,
        soundCategoryData: action.payload?.soundCategory || [],
        totalSoundCategory: action.payload?.totalSoundCategory ?? 0,
      };
    case ActionType.SOUND_CATEGORY_ADD:
      
      let data = [...state.soundCategoryData];
      data.unshift(action.payload);
      return {
        ...state,
        soundCategoryData: data,
      };
    case ActionType.SOUND_CATEGORY_EDIT:
      const { id, editData } = action.payload;
      const updatedSoundCategoryData = state.soundCategoryData?.map((item) => {
        if (item?._id === id) {
          return {
            ...item,
            name: editData.name,
            image: editData.image,
          };
        }
        return item;
      });
      return {
        ...state,
        soundCategoryData: updatedSoundCategoryData,
      };
    case ActionType.SOUND_CATEGORY_DELETE:
      return {
        ...state,
        soundCategoryData: state.soundCategoryData.filter(
          (data) => !action.payload.id.includes(data._id)
        ),
      };
    default:
      return state;
  }
};
