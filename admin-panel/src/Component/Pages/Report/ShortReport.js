import React, { useEffect, useState } from "react";
import Input from "../../extra/Input";
import Selector from "../../extra/Selector";
import NewTitle from "../../extra/Title";
import {
  getVideoReport,
  deleteVideoReport,
  cleanReportData,
} from "../../store/report/report.action";
import { FormControlLabel, Switch } from "@mui/material";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import styled from "@emotion/styled";
import Button from "../../extra/Button";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import AddIcon from "@mui/icons-material/Add";
import { connect, useDispatch, useSelector } from "react-redux";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import noImageFound from "../../../assets/images/noimage.png";
import dayjs from "dayjs";
import WithdrawItemAdd from "../../dialogue/WithdrawItemAdd";
import $ from "jquery";
import UserImage from "../../../assets/images/8.jpg";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import ToggleSwitch from "../../extra/ToggleSwitch";
import { warning } from "../../../util/Alert";
import Searching from "../../extra/Searching";
import { IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import ShowMoreText from "../../extra/ShowMoreText";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

// Matches functions/backend/types/constant.js REPORT_TYPE (8–11: IT Rules 2021 grounds).
const REPORT_TYPE_LABELS = {
  1: "Sexual",
  2: "Violent or Repulsive",
  3: "Hateful or Abusive",
  4: "Harmful or Dangerous",
  5: "Spam or Misleading",
  6: "Child abuse",
  7: "Others",
  8: "Anti-national",
  9: "Hate speech",
  10: "Defamation",
  11: "Sovereignty violation",
};

function ShortReport(props) {
  const { videoReport, totalVideoReport, videoType } = useSelector(
    (state) => state.report
  );
  const { isLoading } = useSelector((state) => state.dialogue);

  const { startDate, endDate, multiButtonSelectData } = props;


  const dispatch = useDispatch();
  const [data, setData] = useState();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [showImg, setShowImg] = useState();
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const startDateFormat = (startDate) => {
    return startDate && dayjs(startDate).isValid()
      ? dayjs(startDate).format("YYYY-MM-DD")
      : "All";
  };
  const endDateFormat = (endDate) => {
    return endDate && dayjs(endDate).isValid()
      ? dayjs(endDate).format("YYYY-MM-DD")
      : "All";
  };

  const startDateData = startDateFormat(startDate);
  const endDateData = endDateFormat(endDate);
  useEffect(() => {
    dispatch(getVideoReport(page, limit, startDateData, endDateData, 2, search || ""));
    return () => {
      dispatch(cleanReportData());
    }
  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (videoType === 2) {
      setData(videoReport);
    }
  }, [videoReport, videoType]);

  const videoReportTable = [
    {
      Header: "checkBox",
      width: "20px",
      Cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectCheckData.some(
            (selectedRow) => selectedRow?._id === row?._id
          )}
          onChange={(e) => handleSelectCheckData(e, row)}
        />
      ),
    },
    {
      Header: "NO",
      body: "no",
      Cell: ({ index }) => (
        <span className="  text-nowrap">
          {(page - 1) * limit + parseInt(index) + 1}
        </span>
      ),
    },
    {
      Header: "SHORT IMAGE",
      body: "image",
      Cell: ({ row }) => (
        // <img
        //   src={row?.videoImage || noImageFound}
        //   width="80px"
        //   height="100px"
        //   style={{ objectFit: "cover" }}
        //   onError={(e) => {
        //     e.target.src = noImageFound;
        //   }}
        // />
        <LazyImage imageSrc={row?.videoImage} width="80px" height="100px" />
      ),

    },
    {
      Header: "CHANNEL NAME",
      body: "fullName",
      Cell: ({ row }) => (
        <span className="text-capitalize text-nowrap">{truncateText(row?.fullName, 24)}</span>
      ),
    },
    {
      Header: "SHORT ID",
      body: "uniqueVideoId",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.uniqueVideoId}</span>
      ),
    },

    {
      Header: "SHORTS TITLE",
      body: "shortsTitle",
      Cell: ({ row }) => (
        <ShowMoreText text={row?.videoTitle} className="text-capitalize" />
      ),
    },
    {
      Header: "SHORT REPORT TYPE",
      body: "reportType",
      Cell: ({ row }) => (
        <>
          <span className="text-capitalize">{REPORT_TYPE_LABELS[Number(row?.reportType)] || "—"}</span>
        </>
      ),
    },

    {
      Header: "SHORT REPORTED",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("MM/DD/YYYY hh:mm A") : ""}
        </span>
      ),
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          {/* <Button
            btnIcon={<TrashIcon />}
            onClick={() => handleDeleteUser(row)}
          /> */}
          <button className="btn btn-sm" onClick={() => handleDeleteUser(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];


  const handleSelectCheckData = (e, row) => {

    const checked = e.target.checked;
    if (checked) {
      setSelectCheckData((prevSelectedRows) => [...prevSelectedRows, row]);
    } else {
      setSelectCheckData((prevSelectedRows) =>
        prevSelectedRows.filter((selectedRow) => selectedRow._id !== row._id)
      );
    }
  };
  const handleSelectAll = (event) => {

    const checked = event.target.checked;
    if (checked) {
      setSelectCheckData([...data]);
    } else {
      setSelectCheckData([]);
    }
  };

  useEffect(() => {
    const currentRows = Array.isArray(data) ? data : [];
    const allSelected =
      currentRows.length > 0 &&
      currentRows.every((row) =>
        selectCheckData.some((selected) => selected?._id === row?._id)
      );

    if (selectAllChecked !== allSelected) {
      setSelectAllChecked(allSelected);
    }
  }, [data, selectCheckData, selectAllChecked]);
  const paginationSubmitButton = () => {

    const selectCheckDataGetId = selectCheckData?.map((item) => item?._id);
    if (actionPagination === "delete" && selectCheckDataGetId?.length > 0) {
      const data = warning();
      data
        .then((res) => {
          if (res) {
            const yes = res.isConfirmed
            if (yes) {
              props.deleteVideoReport(selectCheckDataGetId);
            }
          }
        })
        .catch((err) => console.log(err));
    }
  };
  const handleDeleteUser = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed
          if (yes) {
            const id = row?._id;
            props.deleteVideoReport(id, "user");
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;

  return (
    <div className="">
      <div className=" user-table mb-3">
        <div className="user-table-top">

          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="w-100">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Short Report
              </h5>
            </div>
            <Searching
              placeholder={"Search by id, name, title"}
              label={"Search for type, id, name, title"}
              type={"server"}
              serverSearching={handleServerSearch}
              setSearchData={setSearch}
              customSelectDataShow={true}
              customSelectData={["Delete"]}
              hideActionDropdown={true}
              actionButtonLabel={"Delete"}
              actionPagination={actionPagination}
              setActionPagination={setActionPagination}
              paginationSubmitButton={paginationSubmitButton}
              className={"d-flex justify-content-end w-100"}
              value={search}
              isSubmitDisabled={isSubmitDisabled}
            />
          </div>
        </div>
        <div className="">
          <Table
            data={isLoading ? Array(10).fill({}) : data}
            mapData={videoReportTable.map((col) => ({
              ...col,
              Cell: (props) => {
                if (isLoading) {
                  if (col.Header === "checkBox") {
                    return <Skeleton variant="circular" width={20} height={20} />;
                  } else if (col.Header === "NO") {
                    return <Skeleton variant="text" width="20px" />;
                  } else if (col.Header === "SHORT IMAGE") {
                    return (
                      <div className="d-flex justify-content-center">
                        <Skeleton variant="square" sx={{ borderRadius: "10px" }} width={50} height={50} />
                      </div>
                    );
                  } else if (col.Header === "ACTION") {
                    return (
                      <div className="action-button">
                        <Skeleton variant="circular" width={25} height={25} />
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
            handleSelectAll={handleSelectAll}
            selectAllChecked={selectAllChecked}
            type={"server"}
          />
          <div className="">
            <Pagination
              type={"server"}
              activePage={page}
              rowsPerPage={limit}
              userTotal={totalVideoReport}
              setPage={(pageNumber) => updateParams({ page: pageNumber })}
              handleRowsPerPage={handleRowsPerPage}
              handlePageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  getVideoReport,
  deleteVideoReport,
})(ShortReport);
