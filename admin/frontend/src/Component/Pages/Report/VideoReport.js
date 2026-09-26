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
import noImageFound from "../../../assets/images/noimage.png";
import Button from "../../extra/Button";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import AddIcon from "@mui/icons-material/Add";
import { connect, useDispatch, useSelector } from "react-redux";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import dayjs from "dayjs";
import $ from "jquery";
import UserImage from "../../../assets/images/noimage.png";
import WithdrawItemAdd from "../../dialogue/WithdrawItemAdd";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import ToggleSwitch from "../../extra/ToggleSwitch";
import { warning } from "../../../util/Alert";
import Searching from "../../extra/Searching";
import { IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import ShowMoreText from "../../extra/ShowMoreText";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function VideoReport(props) {
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
    dispatch(getVideoReport(page, limit, startDateData, endDateData, 1, search || ""));
    return () => {
      dispatch(cleanReportData());
    }
  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (videoType === 1) {
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
      Header: "VIDEO IMAGE",
      body: "image",
      Cell: ({ row }) => (
        // <img
        //   src={row.videoImage || noImageFound}
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
      Header: "VIDEO ID",
      body: "uniqueVideoId",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.uniqueVideoId}</span>
      ),
    },


    {
      Header: "VIDEO TITLE",
      body: "videoTitle",
      Cell: ({ row }) => (
        <ShowMoreText text={row?.videoTitle} className="text-capitalize" />
      ),
    },
    {
      Header: "VIDEO REPORT TYPE",
      body: "reportType",
      Cell: ({ row }) => (
        <>
          {row?.reportType === 1 && (
            <span className="text-capitalize">Sexual</span>
          )}
          {row?.reportType === 2 && (
            <span className="text-capitalize">Violent or Replusive</span>
          )}
          {row?.reportType === 3 && (
            <span className="text-capitalize">Hateful or Abusive</span>
          )}
          {row?.reportType === 4 && (
            <span className="text-capitalize">Harmful or Dangerous</span>
          )}
          {row?.reportType === 5 && (
            <span className="text-capitalize">Spam or Misleading</span>
          )}
          {row?.reportType === 6 && (
            <span className="text-capitalize">Child abuse</span>
          )}
          {row?.reportType === 7 && (
            <span className="text-capitalize">Others</span>
          )}
        </>
      ),
    },
    {
      Header: "VIDEO REPORTED",
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
          const yes = res.isConfirmed
          if (yes) {
            if (res) {
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
                }}
              >
                Video Report
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
                  } else if (col.Header === "VIDEO IMAGE") {
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
})(VideoReport);
