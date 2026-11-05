

import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { FormControl, InputLabel, MenuItem, Select, Tooltip } from "@mui/material";
import { IconBan, IconTrash, IconX } from "@tabler/icons-react";

const Searching = (props) => {
  const [search, setSearch] = useState("");
  const debounceTimerRef = useRef(null);
  const hasMountedRef = useRef(false);
  const serverSearchingRef = useRef(null);
  const setSearchDataRef = useRef(null);
  const {
    data,
    setData,
    type,
    serverSearching,
    setSearchData,
    placeholder,
    button,
    newClass,
    btnShow,
    actionShow,
    paginationSubmitButton,
    setActionPagination,
    actionPagination,
    customSelectDataShow,
    customSelectData,
    label,
    actionPaginationDataCustom,
    className,
    isSubmitDisabled = false,
    hideActionDropdown = false,
    actionButtonLabel = "Submit",
    debounceMs = 400,
    inline = false,
    inputMaxWidth,
    value,
  } = props;

  console.log("actionButtonLabel", actionButtonLabel)

  useEffect(() => {
    serverSearchingRef.current = serverSearching;
    setSearchDataRef.current = setSearchData;
  }, [serverSearching, setSearchData]);

  useEffect(() => {
    if (value === undefined || value === null) return;
    setSearch(String(value));
  }, [value]);

  useEffect(() => {
    if (!serverSearchingRef.current) return;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const rawValue = search ?? "";
      serverSearchingRef.current?.(rawValue);
      setSearchDataRef.current?.(rawValue);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, debounceMs]);

  const handleSearch = (event) => {
    event.preventDefault();

    // Client-side search keeps existing behavior (case-insensitive filtering).
    // Server-side search is handled via the debounced effect above (raw query, no encoding).
    if (type === "client") {
      const searchValue = search ? search : event?.target?.value;
      const getLowerCaseSearch = searchValue?.toLowerCase();

      if (getLowerCaseSearch !== undefined) {
        if (getLowerCaseSearch) {
          const filteredData = data.filter((item) => {
            return Object.keys(item).some((key) => {
              if (key === "_id" || key === "updatedAt" || key === "createdAt") {
                return false;
              }
              const itemValue = item[key];
              if (typeof itemValue === "string") {
                return itemValue.toLowerCase().indexOf(getLowerCaseSearch) > -1;
              } else if (typeof itemValue === "number") {
                return itemValue.toString().indexOf(getLowerCaseSearch) > -1;
              } else if (typeof itemValue === "object" && itemValue !== null) {
                // Check for nested object (agencyId) and handle nested properties
                return Object.values(itemValue).some((nestedValue) => {
                  if (typeof nestedValue === "string") {
                    return (
                      nestedValue.toLowerCase().indexOf(getLowerCaseSearch) > -1
                    );
                  }
                  return false;
                });
              }
              return false;
            });
          });
          setData(filteredData); // Update the filteredData state
        } else {
          setData(data); // Reset the filteredData state to the original data
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const paginationActionData = actionPaginationDataCustom ? actionPaginationDataCustom : ["Block", "Unblock", "Delete"];

  if (inline) {
    return (
      <div style={{ width: "100%", maxWidth: inputMaxWidth || 280 }}>
        <input
          type="search"
          autoComplete="false"
          placeholder={placeholder}
          aria-describedby="button-addon4"
          className="form-control"
          value={search}
          onChange={(e) => {
            const inputValue = e.target.value;
            setSearch(inputValue);
            if (!inputValue) {
              handleSearch(e);
              if (serverSearching) {
                if (setSearchData) setSearchData("");
                serverSearching("");
              } else if (setData) {
                setData(data);
              }
            }
            if (type === "client") handleSearch(e);
          }}
          onKeyPress={handleKeyPress}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`row search-action ${className || ""}`} >
        <div className="col-12 col-lg-6 col-md-6 col-sm-12">
          <div className=" searching-box " style={{ float: "right" }}>
            <div
              className={`prime-input search-input-box  m-0 ${newClass}`}
              style={{
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
              }}
            >

              <input
                type="search"
                autoComplete="false"
                placeholder={placeholder}
                title={placeholder}
                aria-describedby="button-addon4"
                className="form-input searchBarBorderr "
                value={search}
                style={{
                  borderRadius: "5px !important",
                  minWidth: "clamp(240px, 38vw, 520px)",
                }}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setSearch(inputValue);
                  if (!inputValue) {
                    handleSearch(e);
                    if (serverSearching) {
                      if (setSearchData) setSearchData("");
                      serverSearching("");
                    } else {
                      setData(data);
                    }
                  }
                  if (type === "client") handleSearch(e);
                }}
                onKeyPress={handleKeyPress}
              />

              {button && (
                <Button
                  type="button"
                  btnIcon={<SearchIcon />}
                  newClass={`themeBtn text-center fs-6  searchBtn text-white `}
                  onClick={(e) => handleSearch(e)}
                />
              )}

            </div>
          </div>
        </div>
        {actionShow === false ? (
          ""
        ) : (
          <div className={`${hideActionDropdown ? "col-12 col-lg-auto col-md-auto col-sm-12" : "col-12 col-lg-6 col-md-6 col-sm-12"} p-0`}>
            <div className={`d-flex align-items-center justify-content-end pagination-box ${hideActionDropdown ? "" : "w-100"}`}>
              <>
                <div className={`d-flex gap-2 justify-content-end ${hideActionDropdown ? "" : "w-100"}`}>
                  {!hideActionDropdown && (
                    <div className="w-100">
                      <select
                        name=""
                        id=""
                        className="form-select "
                        value={actionPagination}
                        onChange={(e) => setActionPagination(e.target.value)}
                      >
                        {customSelectDataShow
                          ? customSelectData?.map((item) => {
                            return (
                              <option value={item?.toLowerCase()} key={item}>
                                {item}
                              </option>
                            );
                          })
                          : paginationActionData?.map((item) => {
                            return (
                              <option value={item?.toLowerCase()} key={item}>
                                {item}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}
                  {/* <Button
                    newClass={"submit-btn"}
                    onClick={paginationSubmitButton}
                    btnName={actionButtonLabel}
                    disabled={isSubmitDisabled}
                  /> */}
                  <Tooltip title="Multiple users can be selected and actions can be performed simultaneously" placement="top" arrow>
                    <div className="submit-btn-multipleSelect" onClick={paginationSubmitButton} disabled={isSubmitDisabled}>
                      {(actionButtonLabel === 'Delete' || actionPagination === 'delete') ? <IconTrash className={`${isSubmitDisabled ? "text-secondary" : "text-danger"}`} size={24} /> : <IconBan className={`${isSubmitDisabled ? "text-secondary" : "text-danger"}`} size={24} />}
                    </div>
                  </Tooltip>
                </div>
              </>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Searching;
