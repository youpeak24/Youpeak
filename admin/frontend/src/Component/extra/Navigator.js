import Tooltip from "@mui/material/Tooltip";
import { Link, useLocation } from "react-router-dom";

const Navigator = (props) => {
  const location = useLocation();
  const { name, path, path2, navIcon, onClick, liClass } = props;

  const isActive =
    location.pathname === path || location.pathname === path2;

  return (
    <ul className="mainMenu">
      <li onClick={onClick} className={liClass}>
        <Tooltip title={name} placement="right" arrow={false}>
          <Link
            to={{ pathname: path }}
            className={isActive ? "activeMenu" : ""}
          >
            <div>
              {navIcon}
              <span className="text-capitalize">{name}</span>
            </div>
            {props?.children && (
              <i className="fa-solid fa-angle-right" style={{ fontSize: "10px" }} />
            )}
          </Link>
        </Tooltip>

        {/* Submenu */}
        <ul className="subMenu transform0" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {props.children?.map((res) => {
            const { subName, subPath, onClick } = res?.props;
            return (
              <Tooltip key={subPath} title={subName} placement="right" arrow={false}>
                <li>
                  <Link
                    to={{ pathname: subPath }}
                    className={location.pathname === subPath ? "activeMenu" : ""}
                    onClick={onClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px 6px 28px",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        background: "var(--gray-400)",
                        flexShrink: 0,
                      }}
                    />
                    <span>{subName}</span>
                  </Link>
                </li>
              </Tooltip>
            );
          })}
        </ul>
      </li>
    </ul>
  );
};

export default Navigator;
