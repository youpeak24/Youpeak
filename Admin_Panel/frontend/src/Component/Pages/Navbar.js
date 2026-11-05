import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserImage from "../../assets/images/defaultUserImage.avif";
import Logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { getDefaultCurrency } from "../store/currency/currency.action";
import { projectName } from "../../util/config";
import { roleHome } from "./PartnerNetwork/networkUi";
import { IconMenuDeep, IconLogout, IconSettings, IconUserSquareRounded, IconChevronDown } from "@tabler/icons-react";
import { warning } from "../../util/Alert";
import { LOGOUT_ADMIN } from "../store/admin/admin.type";

const Navbar = (props) => {
  const { admin } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, [dispatch]);

  const adminName = useMemo(() => admin?.name || "Admin", [admin?.name]);
  const adminEmail = useMemo(() => admin?.email || "", [admin?.email]);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    const data = warning(null, "Are you sure you want to logout?");
    data
      .then((logout) => {
        if (logout?.isConfirmed) {
          dispatch({ type: LOGOUT_ADMIN });
          navigate("/");
          window.location.reload();
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="mainNavbar webNav me-4">
      <div className="row">
        <div className="navBox">
          <div style={{ padding: "0 20px" }}>
            <div
              className="navBar boxBetween"
              style={{ padding: "0 12px", height: "56px" }}
            >
              {/* Left: Toggle */}
              <div className="d-flex align-items-center gap-3">
                <button
                  className="navToggle"
                  id="toggle"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                >
                  <IconMenuDeep size={18} />
                </button>

                {/* Mobile logo */}
                <div className="col-7 logo-show-nav">
                  <Link
                    to={roleHome()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      flexShrink: 0,
                    }}
                  >
                    <img src={Logo} alt="" width={24} height={24} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {projectName}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right: Profile */}
              <div className="navbar-profile-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="navbar-profile-trigger"
                  onClick={() => setIsOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                >
                  <img
                    src={
                      admin?.image && admin.image.trim() !== ""
                        ? admin.image
                        : UserImage
                    }
                    alt="Admin"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = UserImage;
                    }}
                    className="navbar-profile-avatar"
                  />
                  <div className="d-none d-sm-block">
                    <div className="navbar-profile-name">{adminName}</div>
                  </div>
                  <IconChevronDown
                    size={14}
                    style={{
                      color: "var(--text-tertiary)",
                      transition: "transform 0.15s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {isOpen && (
                  <div className="navbar-profile-menu" role="menu">
                    {/* Header */}
                    <div className="navbar-profile-header">
                      <div className="navbar-profile-header-name">{adminName}</div>
                      {!!adminEmail && (
                        <div className="navbar-profile-header-email">{adminEmail}</div>
                      )}
                    </div>

                    {/* Items */}
                    <button
                      type="button"
                      className="navbar-profile-item"
                      role="menuitem"
                      onClick={() => { setIsOpen(false); navigate("/admin/profile"); }}
                    >
                      <IconUserSquareRounded size={15} />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      className="navbar-profile-item"
                      role="menuitem"
                      onClick={() => { setIsOpen(false); navigate("/admin/settingPage"); }}
                    >
                      <IconSettings size={15} />
                      <span>Settings</span>
                    </button>

                    <div className="navbar-profile-divider" />

                    <button
                      type="button"
                      className="navbar-profile-logout"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <span>Sign out</span>
                      <IconLogout size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
