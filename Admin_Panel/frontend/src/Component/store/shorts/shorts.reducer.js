import * as ActionType from "./shorts.type";

const initialState = {
  shortsData: [],
  totalShorts: null,
};

export const shortsReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.GET_SHORTS:
      return {
        ...state,
        shortsData: action.payload.shortsData,
        totalShorts: action.payload.totalShorts,
      };

    case ActionType.IMPORT_SHORT:
      const importedVideo = action.payload;
      const newVideoData = {
        ...importedVideo,
        fullName: importedVideo.userId.fullName,
        uniqueId: importedVideo.userId.uniqueId,
      };

      const updatedShortsData = [newVideoData, ...state.shortsData];
      
      return {
        ...state,
        shortsData: updatedShortsData,
        totalShorts: updatedShortsData?.length,
      };

    case ActionType.EDIT_SHORT:
      const updatedVideoData = state.shortsData.map((item) => {
        if (item._id === action.payload.data._id) {
          return {
            ...action.payload.data,
            title: action.payload.data.title,
            fullName: action.payload.data?.userId?.fullName,
            userId:action.payload.data?.userId?._id,
            image: action.payload.data.userId.image,
            uniqueId: action.payload.data?.uniqueVideoId,
          };
        }
        return item;
      });
      return {
        ...state,
        shortsData: updatedVideoData,
      };
    case ActionType.DELETE_SHORT:
      return {
        ...state,
        shortsData: state.shortsData.filter(
          (data) => !action.payload.id.includes(data._id)
        ),
      };
    default:
      return state;
  }
};
