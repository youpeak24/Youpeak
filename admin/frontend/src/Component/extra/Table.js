import React from "react";
import { Skeleton } from "@mui/material";

function Table(props) {
  const {
    data,
    mapData,
    PerPage,
    Page,
    type,
    style,
    selectAllChecked,
    handleSelectAll,
    loading,
  } = props;

  const sortedData =
    data?.length > 0 ? [...data] : [];

  const startIndex = (Page - 1) * PerPage;
  const endIndex = startIndex + PerPage;
  const currentPageData = data && data.slice(startIndex, endIndex);

  return (
    <div className="primeMain table-custom" style={{ overflowX: "auto" }}>
      <table width="100%" className="primeTable" style={{ ...style }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
          <tr>
            {mapData?.map((res) => (
              <th className="text-nowrap" key={res.Header}>
                <div className="table-head">
                  {res?.Header === "checkBox" ? (
                    <input
                      type="checkbox"
                      checked={selectAllChecked}
                      onChange={handleSelectAll}
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  ) : (
                    res?.Header
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {loading ? (
          <tbody>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <tr key={index}>
                {mapData.map((res, i) => (
                  <td key={i}>
                    <Skeleton
                      variant="rectangular"
                      height={22}
                      style={{ borderRadius: 0 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : (
          <>
            {type === "server" && (
              <tbody>
                {sortedData?.length > 0 ? (
                  sortedData.map((i, k) => (
                    <React.Fragment key={i?._id || `server-row-${k}`}>
                      <tr>
                        {mapData.map((res) => (
                          <td key={`${res?.Header || res?.body || "col"}-${k}`}>
                            {res.Cell ? (
                              <res.Cell row={i} index={k} />
                            ) : (
                              <span className={res.class}>
                                {i[res.body] || "—"}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={mapData.length}
                      className="text-center"
                      style={{
                        padding: "40px 20px",
                        color: "var(--text-tertiary)",
                        fontSize: "0.8rem",
                        borderBottom: "none",
                      }}
                    >
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            )}

            {type === "client" && (
              <tbody>
                {currentPageData?.length > 0 ? (
                  currentPageData.map((i, k) => (
                    <React.Fragment key={i?._id || `client-row-${k}`}>
                      <tr>
                        {mapData.map((res) => (
                          <td key={`${res?.Header || res?.body || "col"}-${k}`}>
                            {res.Cell ? (
                              <res.Cell row={i} index={k} />
                            ) : (
                              <span className={res.class}>
                                {i[res.body]}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={mapData.length}
                      className="text-center"
                      style={{
                        padding: "40px 20px",
                        color: "var(--text-tertiary)",
                        fontSize: "0.8rem",
                        borderBottom: "none",
                      }}
                    >
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </>
        )}
      </table>
    </div>
  );
}

export default Table;
