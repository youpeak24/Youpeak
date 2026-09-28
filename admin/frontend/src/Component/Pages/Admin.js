import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Dashboard from "./dashboard/Dashboard";
import { useEffect } from "react";
import "../../assets/js/custom";
import UserPage from "./UserPage/User";
import VideoPage from "./VideoPage/VideoPage";
import ChannelPage from "./Channel/ChannelPage";
import ShortsPage from "./Shorts/ShortsPage";
import SoundPage from "./Sound/SoundPage";
import Profile from "./Profile";
import PremiumPlan from "./PremiumPlan/PremiumPlan";
import UserSetting from "./UserPage/UserSetting";
import ManageSetting from "./Setting/ManageSetting";
import ManageWithDraw from "./WithDrawRequest/ManageWithDraw";
import ManageMonetization from "./MonetizationRequest/ManageMonetization";
import ManageReport from "./Report/ManageReport";
import MainEarnings from "./Earnings/MainEarnings";
import ManageReward from "./RewardSetting/ManageReward";
import CoinPlan from "./Coin/CoinPlan";
import CoinPlanHistory from "./Earnings/CoinPlanHistory";
import AgencyList from "./Agency/AgencyList";
import AgencyDashboard from "./Agency/AgencyDashboard";
import AgencyReports from "./Reports/AgencyReports";
import TierManagement from "./MembershipTier/TierManagement";
import FraudManagement from "./Fraud/FraudManagement";
import ReferralManagement from "./Referral/ReferralManagement";
import PartnerDashboard from "./DigitalPartner/PartnerDashboard";
import { PartnerReferrals, PartnerRewardHistory, PartnerWalletPage } from "./DigitalPartner/PartnerPortalPages";
import PartnerLocalBusinessAds from "./DigitalPartner/PartnerLocalBusinessAds";
import ManageDigitalPartner from "./DigitalPartner/ManageDigitalPartner";
import DigitalPartnerReports from "./DigitalPartner/DigitalPartnerReports";
import ManageVideoPromotion from "./VideoPromotion/ManageVideoPromotion";
import AgencyDetail from "./Agency/AgencyDetail";
import FranchisePartners from "./Franchise/FranchisePartners";
import FranchiseReferrals from "./Franchise/FranchiseReferrals";
import PartnerDetail from "./DigitalPartner/PartnerDetail";
import {
  TaskerConfig,
  CreatorPassConfig,
  PartnerProgramConfig,
  BoostPromotionConfig,
  PayoutPolicyConfig,
  SafetyConfig,
  AdCreditPacksConfig,
} from "./PlatformConfig/PlatformConfigPages";
import ModerationQueue from "./Moderation/ModerationQueue";
import DuplicateScreening from "./Moderation/DuplicateScreening";
import Loader from "../extra/Loader";
import { getAdminRole, roleHome } from "./PartnerNetwork/networkUi";

// Pages a franchise / partner login may open; everything else is super admin
// only (the backend enforces the same in middleware/admin.middleware.js).
const ROLE_PAGES = {
  AGENCY_ADMIN: [
    "/admin/agencyDashboard",
    "/admin/franchisePartners",
    "/admin/franchiseReferrals",
    "/admin/partnerDetail",
    "/admin/agencyReports",
    "/admin/digitalPartnerReports",
    "/admin/profile",
  ],
  DIGITAL_PARTNER_ADMIN: [
    "/admin/partnerDashboard",
    "/admin/partnerReferrals",
    "/admin/partnerRewards",
    "/admin/partnerWallet",
    "/admin/partnerLocalBusinessAds",
    "/admin/digitalPartnerReports",
    "/admin/profile",
  ],
};

const Admin = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname.replace(/\/+$/, "");
  const allowed = ROLE_PAGES[getAdminRole()];
  // Decided during render so a disallowed page never mounts (and never fires
  // its API calls) before the redirect.
  const redirect = path === "" || path === "/admin" || (allowed && !allowed.includes(path));

  useEffect(() => {
    if (redirect) navigate(roleHome(), { replace: true });
  }, [redirect, navigate]);

  if (redirect) return <Loader />;

  return (
    <>
      <Loader />
      <div className="mainContainer d-flex w-100">
        <div className="containerLeft">
          <Sidebar />
        </div>
        <div className="containerRight w-100 ">
          <Navbar />
          <div className="mainAdmin ml-4">
            <div className="mobSidebar-bg  d-none"></div>
            <Routes>
              <Route path="/mainDashboard" element={<Dashboard />} />
              <Route path="/agency" element={<AgencyList />} />
              <Route path="/agencyDashboard" element={<AgencyDashboard />} />
              <Route path="/agencyReports" element={<AgencyReports />} />
              <Route path="/agencyDetail" element={<AgencyDetail />} />
              <Route path="/franchisePartners" element={<FranchisePartners />} />
              <Route path="/franchiseReferrals" element={<FranchiseReferrals />} />
              <Route path="/partnerDetail" element={<PartnerDetail />} />
              <Route path="/partnerDashboard" element={<PartnerDashboard />} />
              <Route path="/partnerReferrals" element={<PartnerReferrals />} />
              <Route path="/partnerRewards" element={<PartnerRewardHistory />} />
              <Route path="/partnerWallet" element={<PartnerWalletPage />} />
              <Route path="/partnerLocalBusinessAds" element={<PartnerLocalBusinessAds />} />
              <Route path="/manageDigitalPartner" element={<ManageDigitalPartner />} />
              <Route path="/digitalPartnerReports" element={<DigitalPartnerReports />} />
              <Route path="/videoPromotions" element={<ManageVideoPromotion />} />
              <Route path="/membershipTiers" element={<TierManagement />} />
              <Route path="/fraudManagement" element={<FraudManagement />} />
              <Route path="/referralManagement" element={<ReferralManagement />} />
              <Route path="/moderationQueue" element={<ModerationQueue />} />
              <Route path="/duplicateScreening" element={<DuplicateScreening />} />
              <Route path="/config/tasker" element={<TaskerConfig />} />
              <Route path="/config/creatorPasses" element={<CreatorPassConfig />} />
              <Route path="/config/partnerProgram" element={<PartnerProgramConfig />} />
              <Route path="/config/boost" element={<BoostPromotionConfig />} />
              <Route path="/config/payouts" element={<PayoutPolicyConfig />} />
              <Route path="/config/safety" element={<SafetyConfig />} />
              <Route path="/config/adCredits" element={<AdCreditPacksConfig />} />
              <Route path="/userTable" element={<UserPage />} />
              <Route path="/videos" element={<VideoPage />} />
              <Route path="/shorts" element={<ShortsPage />} />
              <Route path="/channel" element={<ChannelPage />} />
              <Route path="/sound" element={<SoundPage />} />
              <Route path="/paymentSetting2" element={<Navigate to="/admin/settingPage" replace />} />
              <Route path="/settingPage" element={<ManageSetting />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/userProfile" element={<UserSetting />} />
              <Route path="/allreport" element={<ManageReport />} />
              <Route path="/premiumPlanTable" element={<PremiumPlan />} />
              <Route path="/coinPlanTable" element={<CoinPlan />} />
              <Route path="/coinplanhistory" element={<CoinPlanHistory />} />
              <Route path="/withdrawRequest" element={<ManageWithDraw />} />
              <Route path="/reward" element={<ManageReward />} />
              <Route
                path="/allmonetizationRequest"
                element={<ManageMonetization />}
              />
              <Route path="/adminEarnings" element={<MainEarnings />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
