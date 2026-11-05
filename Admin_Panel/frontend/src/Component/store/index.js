import { combineReducers } from "redux";
import { dialogueReducer } from "./dialogue/dialogue.reducer";
import { adminReducer } from "./admin/admin.reducer";
import { dashboardReducer } from "./dashboard/dashboard.reducer";
import { userReducer } from "./user/user.reducer";
import { videoReducer } from "./video/video.reducer";
import { shortsReducer } from "./shorts/shorts.reducer";
import { settingsReducer } from "./setting/setting.reducer";
import { soundReducer } from "./sound/sound.reducer";
import { reportReducer } from "./report/report.reducer";
import { premiumPlanReducer } from "./premiumPlan/premiumPlan.reducer";
import { currencyReducer } from "./currency/currency.reducer";
import { withdrawReducer } from "./withdraw/withdraw.reducer";
import { monetizationReducer } from "./monetization/monetization.reducer";
import coinPlanReducer from "./coinPlan/coinPlan.reducer";

export default combineReducers({
  dialogue: dialogueReducer,
  admin: adminReducer,
  dashboard: dashboardReducer,
  user: userReducer,
  video: videoReducer,
  shorts: shortsReducer,
  setting: settingsReducer,
  sound: soundReducer,
  report: reportReducer,
  premiumPlan: premiumPlanReducer,
  coinPlan: coinPlanReducer,
  currency: currencyReducer,
  withdraw: withdrawReducer,
  monetization: monetizationReducer,
});
