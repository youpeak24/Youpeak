import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import Searching from "../../extra/Searching";
import { connect, useDispatch, useSelector } from "react-redux";
import { getLanguages, toggleLanguageState, deleteLanguage } from "../../store/language/language.action";
import { downloadTranslationsCsv } from "../../store/translation/translation.action";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import LazyImage from "../../../common/ImageFallback";
import LanguageImage from "../../../assets/images/8.jpg";
import { useTableParams } from "../../../util/useTableParams";
import dayjs from "dayjs";
import ToggleSwitch from "../../extra/ToggleSwitch";
import { warning } from "../../../util/Alert";
import { IconEdit, IconEye, IconPlus, IconTrash, IconDownload, IconUpload } from "@tabler/icons-react";
import LanguageDialog from "../../dialogue/LanguageDialog";
import TranslationDialog from "../../dialogue/TranslationDialog";
import UploadCsvDialog from "../../dialogue/UploadCsvDialog";
import { Skeleton } from "@mui/material";

function AppLanguage(props) {
  const dispatch = useDispatch();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;

  const { languages, totalLanguages } = useSelector((state) => state.language);
  const { isLoading } = useSelector((state) => state.dialogue);

  const [data, setData] = useState([]);
  const [searchData, setSearchData] = useState(search || "");

  useEffect(() => {
    dispatch(getLanguages(page, limit, search || ""));
  }, [dispatch, page, limit, search]);

  useEffect(() => {
    setData(languages);
  }, [languages]);

  const handlePageChange = (pageNumber) => updateParams({ page: pageNumber });
  const handleRowsPerPage = (value) => updateParams({ limit: value, page: 1 });
  const handleServerSearch = (value) => handleFilterChange({ search: value || "" });

  const handleEdit = (row, type) => {
    dispatch({ type: OPEN_DIALOGUE, payload: { type, data: row } });
    sessionStorage.setItem("dialogueData", JSON.stringify({ dialogue: true, type, dialogueData: row }));
  };

  const handleOpenNew = (type) => {
    dispatch({ type: OPEN_DIALOGUE, payload: { type } });
    sessionStorage.setItem("dialogueData", JSON.stringify({ dialogue: true, type }));
  };

  const handleDelete = (row) => {
    const confirmation = warning(null, "Are you sure you want to delete this language?");
    confirmation.then((res) => {
      if (res.isConfirmed) {
        props.deleteLanguage(row.languageCode);
      }
    });
  };

  const handleToggleState = (row, toggleType) => {

    const actionText = toggleType === 1 ? "Active Status" : "Default Status";
    props.toggleLanguageState(row.languageCode, toggleType, actionText);
  };

  const handleDownload = () => {

    const confirmation = warning(null, "Are you sure you want to download?");
    confirmation.then((res) => {
      if (res.isConfirmed) {
        props.downloadTranslationsCsv();
      }
    });
  };

  const LanguageTableMap = [
    {
      Header: "SR. NO",
      body: "no",
      Cell: ({ index }) => <span>{(page - 1) * limit + parseInt(index) + 1}</span>,
    },
    {
      Header: "ICON",
      body: "icon",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center">
          <LazyImage imageSrc={row?.languageIcon || LanguageImage} width="40px" height="40px" />
        </div>
      ),
    },
    {
      Header: "TITLE",
      body: "title",
      Cell: ({ row }) => <span>{row?.languageTitle || "-"}</span>,
    },
    {
      Header: "CODE",
      body: "code",
      Cell: ({ row }) => <span className="text-uppercase">{row?.languageCode || "-"}</span>,
    },
    {
      Header: "LOCALIZED TITLE",
      body: "localTitle",
      Cell: ({ row }) => <span>{row?.localLanguageTitle || "-"}</span>,
    },
    {
      Header: "ACTIVE",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch value={row?.isActive} onChange={() => handleToggleState(row, 1)} />
      ),
    },
    {
      Header: "DEFAULT",
      body: "isDefault",
      Cell: ({ row }) => (
        <ToggleSwitch value={row?.isDefault} onChange={() => handleToggleState(row, 2)} />
      ),
    },
    {
      Header: "ERRORS",
      body: "errorCount",
      Cell: ({ row }) => <span>{row?.errorCount || 0}</span>,
    },
    {
      Header: "CREATED AT",
      body: "createdAt",
      Cell: ({ row }) => <span>{row?.createdAt ? dayjs(row?.createdAt).format("MM/DD/YYYY hh:mm A") : "-"}</span>,
    },
    {
      Header: "UPDATED AT",
      body: "updatedAt",
      Cell: ({ row }) => <span>{row?.updatedAt ? dayjs(row?.updatedAt).format("MM/DD/YYYY hh:mm A") : "-"}</span>,
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button className="btn btn-sm" onClick={() => handleEdit(row, "translationManage")}>
            <IconEye className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleEdit(row, "languageEdit")}>
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDelete(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="userPage primeHeader">
      <LanguageDialog />
      <TranslationDialog />
      <UploadCsvDialog />

      <div className="user-table mb-3">
        <div className="user-table-top">
          <div className="d-flex flex-md-column flex-lg-row justify-content-between align-items-center w-100">
            <div className="col-lg-2 col-12 d-flex flex-wrap">
              <h5 style={{ fontWeight: "500", fontSize: "20px" }} className="m-0">App Language</h5>
            </div>

            <div className="col-lg-10 col-12 d-flex flex-wrap flex-sm-nowrap justify-content-start justify-content-md-end  gap-2 mt-2">
              <div className="search-filter-main" style={{ flexGrow: 1, maxWidth: "350px", width: "100%" }}>
                <Searching
                  placeholder={"Search by title, code, localized title"}
                  type={"server"}
                  serverSearching={handleServerSearch}
                  setSearchData={setSearchData}
                  value={search}
                  inline={true}
                  actionShow={false}
                  inputMaxWidth="100%"
                />
              </div>

              <Button
                btnIcon={<IconDownload width={18} height={18} />}
                btnName={"Download"}
                onClick={handleDownload}
              />

              <Button
                btnIcon={<IconUpload width={18} height={18} />}
                btnName={"Upload"}
                onClick={() => handleOpenNew("uploadLangCsv")}
              />

              <Button
                btnIcon={<IconPlus width={18} height={18} />}
                btnName={"New"}
                onClick={() => handleOpenNew("languageAdd")}
              />
            </div>
          </div>
        </div>

        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={LanguageTableMap.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "SR. NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "ICON") {
                  return (
                    <div className="d-flex justify-content-center">
                      <Skeleton variant="square" borderRadius={10} width={40} height={40} />
                    </div>
                  );
                } else if (col.Header === "ACTIVE" || col.Header === "DEFAULT") {
                  return (
                    <div className="d-flex justify-content-center">
                      <Skeleton variant="rectangular" width={40} height={20} style={{ borderRadius: "10px" }} />
                    </div>
                  );
                } else if (col.Header === "ACTION") {
                  return (
                    <div className="action-button">
                      <Skeleton variant="circular" width={25} height={25} />
                      <Skeleton variant="circular" width={25} height={25} className="ms-2" />
                      <Skeleton variant="circular" width={25} height={25} className="ms-2" />
                    </div>
                  );
                } else {
                  return <Skeleton variant="text" width="80%" height={20} />;
                }
              }
              return col.Cell ? <col.Cell {...props} /> : props.row[col.body];
            },
          }))}
          serverPerPage={limit}
          serverPage={page}
          type={"server"}
        />

        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={limit}
          userTotal={totalLanguages}
          setPage={(pageNumber) => updateParams({ page: pageNumber })}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default connect(null, { toggleLanguageState, deleteLanguage, downloadTranslationsCsv })(AppLanguage);
