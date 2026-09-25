import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.svg";
import "../../assets/js/custom";
import Navigator from "../extra/Navigator";
import { warning } from "../../util/Alert";
import $ from "jquery";
import { useEffect, useState } from "react";
import { LOGOUT_ADMIN } from "../store/admin/admin.type";
import { useDispatch } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import { projectName } from "../../util/config";
import {
  IconAddressBook, IconAward, IconBellDollar, IconBrandYoutube,
  IconCoin, IconCurrencyDollar, IconEyeQuestion, IconHelpOctagon,
  IconHome, IconLogout, IconMovie, IconMusic, IconPremiumRights,
  IconReport, IconSettings, IconUser, IconUserQuestion, IconUserSquareRounded,
  IconVideo, IconLanguage, IconX,
} from "@tabler/icons-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => {
    handleCloseFunction();
    const data = warning(null, "Are you sure you want to logout?");
    data
      .then((logout) => {
        if (logout) {
          const yes = logout.isConfirmed;
          if (yes) {
            dispatch({ type: LOGOUT_ADMIN });
            navigate("/");
            window.location.reload();
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const handleCloseFunction = () => {
    dispatch({ type: CLOSE_DIALOGUE, payload: { dialogue: false } });
    let dialogueData_ = { dialogue: false };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
    sessionStorage.removeItem("multiButton");
  };

  const adminObj = JSON.parse(sessionStorage.getItem("admin") || "{}");
  const isAgencyAdmin = adminObj?.role === "AGENCY_ADMIN";
  const isDigitalPartnerAdmin = adminObj?.role === "DIGITAL_PARTNER_ADMIN";

  const navBarArray = isAgencyAdmin
    ? [{ name: "District Franchise Dashboard", path: "/admin/agencyDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction }]
    : isDigitalPartnerAdmin
    ? [{ name: "Partner Dashboard", path: "/admin/partnerDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction }]
    : [{ name: "Dashboard", path: "/admin/mainDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction }];

  const generalArray = [
    { name: "Profile", path: "/admin/profile", navIcon: <IconUserSquareRounded size={15} />, onClick: handleCloseFunction },
    { name: "Logout", navIcon: <IconLogout size={15} />, onClick: handleLogout },
  ];

  const groupedNav = isAgencyAdmin
    ? [
        {
          heading: "DISTRICT FRANCHISE",
          items: [
            { name: "District Franchise Dashboard", path: "/admin/agencyDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction },
            { name: "District Franchise Reports", path: "/admin/agencyReports", navIcon: <IconReport size={15} />, onClick: handleCloseFunction },
          ],
        },
      ]
    : isDigitalPartnerAdmin
    ? [
        {
          heading: "DIGITAL PARTNER",
          items: [
            { name: "Partner Dashboard", path: "/admin/partnerDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction },
            { name: "Local Business Ads", path: "/admin/partnerLocalBusinessAds", navIcon: <IconBellDollar size={15} />, onClick: handleCloseFunction },
            { name: "My Reports", path: "/admin/digitalPartnerReports", navIcon: <IconReport size={15} />, onClick: handleCloseFunction },
          ],
        },
      ]
    : [
        {
          heading: "FRANCHISE & REGIONAL",
          items: [
            { name: "Geofenced Franchises", path: "/admin/agency", navIcon: <IconUserSquareRounded size={15} />, onClick: handleCloseFunction },
            { name: "Franchise Dashboard", path: "/admin/agencyDashboard", navIcon: <IconHome size={15} />, onClick: handleCloseFunction },
            { name: "Franchise Reports", path: "/admin/agencyReports", navIcon: <IconReport size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "DIGITAL PARTNER",
          items: [
            { name: "Manage Partners", path: "/admin/manageDigitalPartner", navIcon: <IconBellDollar size={15} />, onClick: handleCloseFunction },
            { name: "Partner Reports", path: "/admin/digitalPartnerReports", navIcon: <IconReport size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "USERS",
          items: [
            { name: "Users", path: "/admin/userTable", path2: "/admin/userProfile", navIcon: <IconUser size={15} />, onClick: handleCloseFunction },
            { name: "Membership Tiers", path: "/admin/membershipTiers", navIcon: <IconAward size={15} />, onClick: handleCloseFunction },
            { name: "Fraud & Security", path: "/admin/fraudManagement", navIcon: <IconHelpOctagon size={15} />, onClick: handleCloseFunction },
            { name: "Referral Management", path: "/admin/referralManagement", navIcon: <IconAddressBook size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "CONTENT",
          items: [
            { name: "Channel", path: "/admin/channel", navIcon: <IconBrandYoutube size={15} />, onClick: handleCloseFunction },
            { name: "Videos", path: "/admin/videos", navIcon: <IconVideo size={15} />, onClick: handleCloseFunction },
            { name: "Bites", path: "/admin/shorts", navIcon: <IconMovie size={15} />, onClick: handleCloseFunction },
            { name: "Sound", path: "/admin/sound", navIcon: <IconMusic size={15} />, onClick: handleCloseFunction },
            { name: "Video Promotions", path: "/admin/videoPromotions", navIcon: <IconBellDollar size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "LANGUAGE",
          items: [
            { name: "App Language", path: "/admin/appLanguage", navIcon: <IconLanguage size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "REPORTS & SUPPORT",
          items: [
            { name: "Reports", path: "/admin/allreport", navIcon: <IconReport size={15} />, onClick: handleCloseFunction },
            { name: "FAQ", path: "/admin/faqs", navIcon: <IconHelpOctagon size={15} />, onClick: handleCloseFunction },
            { name: "Contact Us", path: "/admin/contactUs", navIcon: <IconAddressBook size={15} />, onClick: handleCloseFunction },
            { name: "Grievance Officer", path: "/admin/grievance", navIcon: <IconHelpOctagon size={15} />, onClick: handleCloseFunction },
          ],
        },
        {
          heading: "FINANCIALS",
          items: [
            { name: "Coin Plan", path: "/admin/coinPlanTable", navIcon: <IconCoin size={15} />, onClick: handleCloseFunction },
            { name: "Premium Plan", path: "/admin/premiumPlanTable", navIcon: <IconPremiumRights size={15} />, onClick: handleCloseFunction },
            { name: "Currency", path: "/admin/allCurrency", navIcon: <IconCurrencyDollar size={15} />, onClick: handleCloseFunction },
            { name: "Monetization Request", path: "/admin/allmonetizationRequest", navIcon: <IconEyeQuestion size={15} />, onClick: handleCloseFunction },
            { name: "Withdraw Request", path: "/admin/withdrawRequest", navIcon: <IconUserQuestion size={15} />, onClick: handleCloseFunction },
            { name: "Order History", path: "/admin/adminEarnings", path2: "/admin/coinplanhistory", navIcon: <IconBellDollar size={15} />, onClick: handleCloseFunction },
            { name: "Reward", path: "/admin/reward", navIcon: <IconAward size={15} />, onClick: handleCloseFunction },
          ],
        },
      ];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    if (mediaQuery?.matches) {
      $(".sideBar.mobSidebar").removeClass("mobSidebar");
      $(".sideBar").addClass("webSidebar");
    }
    $(".mobSidebar-bg").removeClass("responsive-bg");
  }, [location.pathname]);

  return (
    <>
      <Script />
      <div className="mainSidebar">
        <div className="sideBar webSidebar" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* ─── Logo / Brand ─── */}
          <div className="sideBarLogo" style={{ flexShrink: 0 }}>
            <Link
              to="/admin/mainDashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                flex: 1,
              }}
            >
              <img src={Logo} alt="" width={24} height={24} />
              <span
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {projectName}
              </span>
            </Link>
            <div
              className="sidebar-close-btn close-sidebar-icon"
              style={{
                cursor: "pointer",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                padding: "4px",
              }}
            >
              <IconX size={16} />
            </div>
          </div>

          {/* ─── Scrollable Nav ─── */}
          <div
            className="navigation"
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "16px" }}
          >
            {/* Overview / Main */}
            <p className="sideBarTitle sidebar-title">OVERVIEW</p>
            <nav className="sidebar-nav-container">
              {navBarArray.map((res) => (
                <Navigator
                  key={res.path}
                  name={res?.name}
                  path={res?.path}
                  path2={res?.path2}
                  navIcon={res?.navIcon}
                  onClick={res?.onClick && res?.onClick}
                />
              ))}
            </nav>

            {/* Grouped sections */}
            {groupedNav.map((group, idx) => (
              <div key={idx}>
                <p className="sideBarTitle sidebar-title">{group.heading}</p>
                <nav className="sidebar-nav-container">
                  {group.items.map((res) => (
                    <Navigator
                      key={res.path}
                      name={res?.name}
                      path={res?.path}
                      path2={res?.path2}
                      navIcon={res?.navIcon}
                      onClick={res?.onClick && res?.onClick}
                    >
                      {res?.subMenu &&
                        res?.subMenu?.map((subMenu) => (
                          <Navigator
                            key={subMenu.subPath}
                            subName={subMenu.subName}
                            subPath={subMenu.subPath}
                            subPath2={subMenu.subPath2}
                            onClick={subMenu.onClick}
                          />
                        ))}
                    </Navigator>
                  ))}
                </nav>
              </div>
            ))}

            {/* System */}
            <p className="sideBarTitle sidebar-title">SYSTEM</p>
            <nav className="sidebar-nav-container">
              {generalArray.map((res, i) => (
                <Navigator
                  key={i}
                  name={res?.name}
                  path={res?.path}
                  navIcon={res?.navIcon}
                  onClick={res?.onClick && res?.onClick}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

export const Script = (props) => {
  useEffect(() => {
    const handleClick = (event) => {
      const target = $(event.currentTarget);
      const submenu = target.next(".subMenu");
      $(".subMenu").not(submenu).slideUp();
      submenu.slideToggle();
      target.children("i").toggleClass("rotate90");
      $(".mainMenu > li > a > i").not(target.children("i")).removeClass("rotate90");
    };

    const handleToggle = () => {
      $(".mainNavbar").toggleClass("mobNav webNav");
      $(".sideBar").toggleClass("mobSidebar webSidebar");
      $(".mainAdmin").toggleClass("mobAdmin");
      $(".fa-angle-right").toggleClass("rotated toggleIcon");
      $(".comShow").toggleClass("mobCom webCom");
      $(".sideBarLogo a").toggleClass("justify-content-center");

      var checkClass = $(".sideBar").hasClass("mobSidebar");
      if (checkClass) {
        var mobSidebarBg = document.querySelector(".mobSidebar-bg");
        mobSidebarBg.classList.add("responsive-bg");
      } else {
        $(".mobSidebar-bg").removeClass("responsive-bg");
      }
    };

    $(".subMenu").hide();
    $(".mainMenu > li > a").on("click", handleClick);
    $(".navToggle").on("click", handleToggle);
    $(".sidebar-close-btn").on("click", handleToggle);
    $(".mobSidebar-bg").on("click", handleToggle);

    return () => {
      $(".mainMenu > li > a").off("click", handleClick);
      $(".navToggle").off("click", handleToggle);
      $(".sidebar-close-btn").off("click", handleToggle);
      $(".mobSidebar-bg").off("click", handleToggle);
    };
  }, []);

  return null;
};
