import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.svg";
import "../../assets/js/custom";
import Navigator from "../extra/Navigator";
import { warning } from "../../util/Alert";
import $ from "jquery";
import { ReactComponent as DownArrow } from "../../assets/icons/DownArrow.svg";
import { useEffect, useState } from "react";
import { LOGOUT_ADMIN } from "../store/admin/admin.type";
import { useDispatch } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import { projectName } from "../../util/config";
import { IconAddressBook, IconAward, IconBellDollar, IconBrandYoutube, IconCoin, IconCurrencyDollar, IconEyeQuestion, IconHelpOctagon, IconHome, IconLogout, IconMovie, IconMusic, IconPremiumRights, IconReport, IconSettings, IconUser, IconUserQuestion, IconUserSquareRounded, IconVideo, IconLanguage, IconX } from "@tabler/icons-react";

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
    dispatch({
      type: CLOSE_DIALOGUE,
      payload: {
        dialogue: false,
      },
    });

    let dialogueData_ = {
      dialogue: false,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
    sessionStorage.removeItem("multiButton");
  };

  const adminObj = JSON.parse(sessionStorage.getItem("admin") || "{}");
  const isAgencyAdmin = adminObj?.role === "AGENCY_ADMIN";
  const isDigitalPartnerAdmin = adminObj?.role === "DIGITAL_PARTNER_ADMIN";

  const navBarArray = isAgencyAdmin
    ? [
        {
          name: "Agency Dashboard",
          path: "/admin/agencyDashboard",
          navIcon: <IconHome />,
          onClick: handleCloseFunction,
        },
      ]
    : isDigitalPartnerAdmin
    ? [
        {
          name: "Partner Dashboard",
          path: "/admin/partnerDashboard",
          navIcon: <IconHome />,
          onClick: handleCloseFunction,
        },
      ]
    : [
        {
          name: "Dashboard",
          path: "/admin/mainDashboard",
          navIcon: <IconHome />,
          onClick: handleCloseFunction,
        },
      ];

  const generalArray = [
    {
      name: "Profile",
      path: "/admin/profile",
      navIcon: <IconUserSquareRounded />,
      onClick: handleCloseFunction,
    },
    {
      name: "Logout",
      navIcon: <IconLogout />,
      onClick: handleLogout,
    },
  ];

  const groupedNav = isAgencyAdmin
    ? [
        {
          heading: "AGENCY & REGIONAL",
          items: [
            {
              name: "Agency Dashboard",
              path: "/admin/agencyDashboard",
              navIcon: <IconHome />,
              onClick: handleCloseFunction,
            },
            {
              name: "Agency Reports",
              path: "/admin/agencyReports",
              navIcon: <IconReport />,
              onClick: handleCloseFunction,
            },
          ],
        },
      ]
    : isDigitalPartnerAdmin
    ? [
        {
          heading: "DIGITAL PARTNER",
          items: [
            {
              name: "Partner Dashboard",
              path: "/admin/partnerDashboard",
              navIcon: <IconHome />,
              onClick: handleCloseFunction,
            },
            {
              name: "Local Business Ads",
              path: "/admin/partnerLocalBusinessAds",
              navIcon: <IconBellDollar />,
              onClick: handleCloseFunction,
            },
          ],
        },
      ]
    : [
        {
          heading: "AGENCY & REGIONAL",
          items: [
            {
              name: "Geofenced Agencies",
              path: "/admin/agency",
              navIcon: <IconUserSquareRounded />,
              onClick: handleCloseFunction,
            },
            {
              name: "Agency Dashboard",
              path: "/admin/agencyDashboard",
              navIcon: <IconHome />,
              onClick: handleCloseFunction,
            },
            {
              name: "Agency Reports",
              path: "/admin/agencyReports",
              navIcon: <IconReport />,
              onClick: handleCloseFunction,
            },
          ],
        },
        {
          heading: "DIGITAL PARTNER",
          items: [
            {
              name: "Manage Digital Partners",
              path: "/admin/manageDigitalPartner",
              navIcon: <IconBellDollar />,
              onClick: handleCloseFunction,
            },
          ],
        },
        {
          heading: "USER MANAGEMENT",
          items: [
            {
              name: "User",
              path: "/admin/userTable",
              path2: "/admin/userProfile",
              navIcon: <IconUser />,
              onClick: handleCloseFunction,
            },
            {
              name: "Membership Tiers",
              path: "/admin/membershipTiers",
              navIcon: <IconAward />,
              onClick: handleCloseFunction,
            },
            {
              name: "Fraud & Account Security",
              path: "/admin/fraudManagement",
              navIcon: <IconHelpOctagon />,
              onClick: handleCloseFunction,
            },
            {
              name: "Referral Management",
              path: "/admin/referralManagement",
              navIcon: <IconAddressBook />,
              onClick: handleCloseFunction,
            },
          ],
        },
    {
      heading: "CONTENT MANAGEMENT",
      items: [
        {
          name: "Channel",
          path: "/admin/channel",

          navIcon: <IconBrandYoutube />,
          onClick: handleCloseFunction,
        },
        {
          name: "Videos",
          path: "/admin/videos",
          navIcon: <IconVideo />,
          onClick: handleCloseFunction,
        },
        {
          name: "Shorts",
          path: "/admin/shorts",
          navIcon: <IconMovie />,
          onClick: handleCloseFunction,
        },
        {
          name: "Sound",
          path: "/admin/sound",
          navIcon: <IconMusic />,
          onClick: handleCloseFunction,
        },
      ],
    },
    {
      heading: "LANGUAGE MANAGEMENT",
      items: [
        {
          name: "App Language",
          path: "/admin/appLanguage",
          navIcon: <IconLanguage />,
          onClick: handleCloseFunction,
        },
      ],
    },
    {
      heading: "REPORT & SUPPORT",
      items: [
        {
          name: "Report",
          path: "/admin/allreport",
          navIcon: <IconReport />,
          onClick: handleCloseFunction,
        },
        {
          name: "FAQ",
          path: "/admin/faqs",
          navIcon: <IconHelpOctagon />,
          onClick: handleCloseFunction,
        },
        {
          name: "Contact Us",
          path: "/admin/contactUs",
          navIcon: <IconAddressBook />,
          onClick: handleCloseFunction,
        },
        {
          name: "Grievance Officer",
          path: "/admin/grievance",
          navIcon: <IconHelpOctagon />,
          onClick: handleCloseFunction,
        },
      ],
    },
    {
      heading: "FINANCIAL & PLANS",
      items: [
        {
          name: "Coin Plan",
          path: "/admin/coinPlanTable",
          navIcon: <IconCoin />,
          onClick: handleCloseFunction,
        },
        {
          name: "Premium Plan",
          path: "/admin/premiumPlanTable",
          navIcon: <IconPremiumRights />,
          onClick: handleCloseFunction,
        },
        {
          name: "Currency",
          path: "/admin/allCurrency",
          navIcon: <IconCurrencyDollar />,
          onClick: handleCloseFunction,
        },
        {
          name: "Monetization Request",
          path: "/admin/allmonetizationRequest",
          navIcon: <IconEyeQuestion />,
          onClick: handleCloseFunction,
        },
        {
          name: "Withdraw Request",
          path: "/admin/withdrawRequest",
          navIcon: <IconUserQuestion />,
          onClick: handleCloseFunction,
        },
        {
          name: "Order History",
          path: "/admin/adminEarnings",
          path2: "/admin/coinplanhistory",
          navIcon: <IconBellDollar />,
          onClick: handleCloseFunction,
        },
        {
          name: "Reward",
          path: "/admin/reward",
          navIcon: <IconAward />,
          onClick: handleCloseFunction,
        }
      ],
    },
  ]

  const [totalPage, setTotalPage] = useState(20);

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
      <Script totalPage={totalPage} />
      <div className="mainSidebar">
        <div className="sideBar webSidebar">
          <div className="sideBarLogo d-flex align-items-center justify-content-between">
            <Link
              to={"/admin/mainDashboard"}
              className="d-flex align-items-center cursor-pointer"
            >
              <img src={Logo} alt="" width={"35px"} />
              <span
                className="fs-4 fw-semibold"
                style={{ color: "var(--text-white)", letterSpacing: '0.5px' }}
              >
                {projectName}
              </span>
            </Link>
            <div className="sidebar-close-btn close-sidebar-icon" style={{ cursor: "pointer" }}>
              <IconX size={20} />
            </div>
          </div>
          {/* ======= Navigation ======= */}
          <div className="navigation">
            <p
              className="sideBarTitle sidebar-title "
            >
              MENU
            </p>
            {/* <nav style={{ backgroundColor: "#f0f0f0" }}> */}
            <nav className="sidebar-nav-container">
              {/* About */}
              {navBarArray?.length > 0 && (
                <>
                  {(totalPage > 0
                    ? navBarArray.slice(0, totalPage)
                    : navBarArray
                  ).map((res) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>

            {groupedNav.map((group, idx) => (
              <div key={idx}>
                <p
                  className="sideBarTitle sidebar-title "
                >
                  {group.heading}
                </p>
                <nav className="sidebar-nav-container">
                  {group.items.map((res) => (
                    <Navigator
                      name={res?.name}
                      path={res?.path}
                      path2={res?.path2}
                      navIcon={res?.navIcon}
                      navIconImg={res?.navIconImg}
                      navSVG={res?.navSVG}
                      onClick={res?.onClick && res?.onClick}
                    >
                      {/* subMenu if any */}
                      {res?.subMenu &&
                        res?.subMenu?.map((subMenu) => (
                          <Navigator
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

            <p
              className="sideBarTitle sidebar-title "
            >
              SYSTEM
            </p>
            <nav className="sidebar-nav-container">
              {/* About */}
              {generalArray?.length > 0 && (
                <>
                  {(totalPage > 0
                    ? generalArray.slice(0, totalPage)
                    : generalArray
                  ).map((res) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>
            <div className="boxCenter mt-2">
              <DownArrow
                onClick={() => setTotalPage(navBarArray.length)}
                className={`text-center mx-auto cursor ${totalPage === navBarArray.length && "d-none"
                  }`}
                style={{ transition: "0.5s" }}
              />
            </div>
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

      // Toggle rotation class on the clicked icon
      target.children("i").toggleClass("rotate90");

      // Remove rotation class from other icons
      $(".mainMenu > li > a > i")
        .not(target.children("i"))
        .removeClass("rotate90");
    };

    const handleToggle = () => {
      $(".mainNavbar").toggleClass("mobNav webNav");
      $(".sideBar").toggleClass("mobSidebar webSidebar");

      $(".mainAdmin").toggleClass("mobAdmin");
      $(".fa-angle-right").toggleClass("rotated toggleIcon");
      $(".comShow").toggleClass("mobCom webCom");

      // $(".sideBarTitle").toggleClass("hidden");
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
  }, [props.totalPage]);

  return null;
};
