import React, { useEffect, useState } from "react";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import Searching from "../../extra/Searching";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  getCommentsApi,
  deleteVideoComments,
} from "../../store/video/video.action";
import { warning } from "../../../util/Alert";
// import { covertURl } from "../../../util/AwsFunction";
import UserImage from "../../../assets/images/8.jpg";
import $ from "jquery";
import dayjs from "dayjs";
import { IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function ShortComment(props) {
  const { startDate, endDate, multiButtonSelectData } = props;
  const dispatch = useDispatch();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [data, setData] = useState([]);

  const [showURLs, setShowURLs] = useState([]);
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  const { commentData, totalVideoComment } = useSelector(
    (state) => state.video
  );
  const { isLoading } = useSelector((state) => state.dialogue);

  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  $(document).ready(function () {
    $("img").bind("error", function () {
      // Set the default image
      $(this).attr("src", UserImage);
    });
  });

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };
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
    if (actionPagination?.toLowerCase() === "delete" && selectCheckDataGetId?.length > 0) {
      const data = warning();
      data
        .then((res) => {
          if (res) {
            const yes = res.isConfirmed
            if (yes) {
              props.deleteVideoComments(selectCheckDataGetId);

            }
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const handleDeleteVideo = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed
          if (yes) {
            const id = row?._id;
            props.deleteVideoComments(id);
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const commentMapData = [
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
      Header: "USER",
      body: "userName",
      Cell: ({ row, index }) => (
        <div className="d-flex align-items-center">
          <LazyImage
            imageSrc={row?.userImage ? row?.userImage : UserImage}
            width="50px"
            height="50px"
          />


          <div className="ms-3 ">
            {/* Nick Name */}
            <div className="fw-semibold text-start text-capitalize">
              {row?.fullName || "-"}
            </div>

            {/* Full Name */}
            <div className="text-muted small text-start text-capitalize">
              {row?.nickName || "-"}
            </div>
            <div className="text-muted small text-start text-capitalize">
              <UniqueIdCopy value={row?.uniqueId} placeholder="-" />
            </div>
          </div>
        </div>
      ),
    },
    {
      Header: "BITE ID",
      body: "uniqueVideoId",
      Cell: ({ row }) => (
        <span className="cursorPointer">{row?.uniqueVideoId}</span>
      ),
    },
    {
      Header: "TEXT",
      body: "commentText",
      Cell: ({ row }) => (
        <span className="text-capitalize">{truncateText(row?.commentText, 30)}</span>
      ),
    },
    {
      Header: "TITLE",
      body: "title",
      Cell: ({ row }) => (
        <span className="text-capitalize">{truncateText(row?.videoTitle, 30)}</span>
      ),
    },

    {
      Header: "CREATED AT",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="cursorPointer text-nowrap text-capitalize">
          {dayjs(row?.createdAt).format("MM/DD/YYYY hh:mm A")}
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
            onClick={() => handleDeleteVideo(row)}
          /> */}
          <button className="btn btn-sm" onClick={() => handleDeleteVideo(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    dispatch(getCommentsApi(page, limit, startDate, endDate, 2, search || ""));
  }, [dispatch, startDate, endDate, page, limit, search]);

  useEffect(() => {
    setData(commentData);
  }, [commentData]);

  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;

  return (
    <div>
      <div className="user-table mb-3">
        <div className="user-table-top">
          <div className="d-flex justify-content-between w-100">
            <div className="w-100">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Manage Comment
              </h5>

            </div>
            <Searching
              label={"Search for ID, Keyword, Text, Title"}
              placeholder={"Search by id, name, comment, title"}
              type={"server"}
              serverSearching={handleServerSearch}
              setSearchData={setSearch}
              value={search}
              customSelectDataShow={true}
              customSelectData={["Delete"]}
              hideActionDropdown={true}
              actionButtonLabel={"Delete"}
              actionPagination={actionPagination}
              setActionPagination={setActionPagination}
              paginationSubmitButton={paginationSubmitButton}
              isSubmitDisabled={isSubmitDisabled}
              className={"d-flex justify-content-end w-100"}
            />
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={commentMapData.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "checkBox") {
                  return <Skeleton variant="circular" width={20} height={20} />;
                } else if (col.Header === "NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "USER") {
                  return (
                    <div className="d-flex align-items-center">
                      <Skeleton variant="square" borderRadius={10} width={50} height={50} />
                      <div className="ms-3" style={{ flex: 1 }}>
                        <Skeleton variant="text" width="100px" height={20} />
                        <Skeleton variant="text" width="80px" height={15} />
                        <Skeleton variant="text" width="60px" height={15} />
                      </div>
                    </div>
                  );
                } else if (col.Header === "ACTION") {
                  return (
                    <div className="action-button">
                      <Skeleton variant="circular" width={30} height={30} />
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
        <div className="mt-3">
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={limit}
            userTotal={totalVideoComment}
            setPage={(pageNumber) => updateParams({ page: pageNumber })}
            customSelectDataShow={true}
            customSelectData={["Delete"]}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
            actionPagination={actionPagination}
            setActionPagination={setActionPagination}
            paginationSubmitButton={paginationSubmitButton}
          />
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  getCommentsApi,
  deleteVideoComments,
})(ShortComment);
