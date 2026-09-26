import React, { useEffect, useState } from "react";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import Searching from "../../extra/Searching";
import { connect, useDispatch, useSelector } from "react-redux";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { getShortsApi, deleteShort } from "../../store/shorts/shorts.action";
import { warning } from "../../../util/Alert";
import UserImage from "../../../assets/images/8.jpg";
import $ from "jquery";
import { useNavigate } from "react-router-dom";
import { IconEdit, IconPlayerPlayFilled, IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import HandleVideo from "../../../common/HandleVideo";
import ShowVideo from "../../dialogue/ShowVideo";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import ShowMoreText from "../../extra/ShowMoreText";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function ManageShorts(props) {
  const { startDate, endDate, multiButtonSelectData } = props;
  const dispatch = useDispatch();
  const [checkBox, setCheckBox] = useState();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
    visibilityType: "",
    audienceType: "",
    commentType: "",
    scheduleType: "",
  });
  const { page, limit, search, visibilityType, audienceType, commentType, scheduleType } = params;
  const [, setSearch] = useState(search || "");
  const [verificationRequests, setVerificationRequests] = useState();
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [data, setData] = useState([]);


  const [showURLs, setShowURLs] = useState([]);
  const [showVideoURLs, setShowVideoURLs] = useState([]);

  const navigate = useNavigate();
  const { shortsData, totalShorts } = useSelector((state) => state.shorts);
  const { isLoading } = useSelector((state) => state.dialogue);

  const [show, setShow] = useState(false);
  const [url, setUrl] = useState();

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
    if (actionPagination === "delete" && selectCheckDataGetId?.length > 0) {
      const data = warning();
      data
        .then((res) => {
          if (res) {
            const yes = res.isConfirmed;
            if (yes) {
              props.deleteShort(selectCheckDataGetId);
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
          if (res.isConfirmed) {
            const id = row?._id;
            props.deleteShort(id);
          }
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchData();
    // fetchVideoData();
  }, [data]);

  const fetchData = async () => {
    if (!data || data.length === 0) {
      return;
    }

    const urls = (
      data.map(async (item) => {
        const fileNameWithExtension = item?.image

        return fileNameWithExtension;
      })
    );
    setShowURLs(urls);
  };




  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const handleEdit = (row, type) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: {
        type: type,
        data: row,
      },
    });

    let dialogueData_ = {
      dialogue: true,
      type: type,
      dialogueData: row,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };

  const videoMapData = [
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
      Header: "VIDEO",
      body: "video",
      Cell: ({ row, index }) => (
        <div
          className="d-flex justify-content-center"
          onClick={() => {
            setShow(true);
            setUrl(row?.videoUrl);
          }}
        >
          {/* <HandleVideo thumbnail={row?.videoImage} videoUrl={row?.videoUrl} /> */}

          <div
            style={{
              position: "relative",
              width: "50px",
              height: "50px",
              cursor: "pointer",
            }}
          >
            <IconPlayerPlayFilled
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)", // centers it
                zIndex: 1,
                fontSize: "20px", // adjust size as needed
                color: "white", // optional: make it visible
              }}
            />
            <LazyImage
              imageSrc={row?.videoImage}
              width="50px"
              height="50px"
              style={{ filter: "brightness(0.5)" }}
            />

          </div>
        </div>
      ),
    },
    {
      Header: "ADDED BY",
      body: "addedBy",
      Cell: ({ row, index }) => (
        <div
          className="d-flex align-items-center"
        >
          <LazyImage imageSrc={row?.image} width="50px" height="50px" />
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
      Header: "UNIQUE VIDEO ID",
      body: "uniqueVideoId",
      Cell: ({ row }) => (
        <span className="cursorPointer">{row?.uniqueVideoId}</span>
      ),
    },
    {
      Header: "TITLE",
      Cell: ({ row }) => (
        <ShowMoreText text={row?.title} className="text-capitalize" />
      ),
    },



    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">

          <button className="btn btn-sm" onClick={() => handleEdit(row, "editShort")}>
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDeleteVideo(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  const handleClose = () => {
    setShow(false);
    setUrl("");
  };

  useEffect(() => {
    // const timer = setTimeout(() => {
    dispatch(
      getShortsApi(
        2,
        page,
        limit,
        startDate,
        endDate,
        search || "",
        visibilityType,
        audienceType,
        commentType,
        scheduleType
      )
    );
    // },2000);

    // return () => clearTimeout(timer);
  }, [
    dispatch,
    startDate,
    endDate,
    page,
    limit,
    search,
    visibilityType,
    audienceType,
    commentType,
    scheduleType,
  ]);

  useEffect(() => {
    setData(shortsData);
  }, [shortsData]);

  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;

  return (
    <div>
      <ShowVideo
        title={"Video"}
        show={show}
        url={url}
        handleClose={handleClose}
      />
      <div className="user-table mb-3">
        <div className="user-table-top">
          <div className="d-flex justify-content-between align-items-start w-100 gap-2">
            <div className="col-12 col-sm-4">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Manage Bite
              </h5>

            </div>
            <div className="col-12 col-sm-8 d-flex flex-column align-items-end">


              <Searching
                label={"Search for ID, Keyword, Title, Username "}
                placeholder={"Search by id, title, description, hashtag, name"}
                type={"server"}
                serverSearching={handleServerSearch}
                setSearchData={setSearch}
                customSelectDataShow={true}
                customSelectData={["Delete"]}
                actionPagination={actionPagination}
                setActionPagination={setActionPagination}
                paginationSubmitButton={paginationSubmitButton}
                isSubmitDisabled={isSubmitDisabled}
                hideActionDropdown={true}
                actionButtonLabel={"Delete"}
                className={"justify-content-end mx-1"}
                value={search}
              />
              <div className="d-flex justify-content-end mt-2">
                <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap justify-content-end">
                  <select
                    className="form-select"
                    style={{ width: 180 }}
                    value={visibilityType}
                    onChange={(e) => {
                      handleFilterChange({ visibilityType: e.target.value });
                    }}
                  >
                    <option value="">Visibility (All)</option>
                    <option value="1">Public</option>
                    <option value="2">Private</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ width: 180 }}
                    value={audienceType}
                    onChange={(e) => {
                      handleFilterChange({ audienceType: e.target.value });
                    }}
                  >
                    <option value="">Audience (All)</option>
                    <option value="1">Kids</option>
                    <option value="2">Adults</option>
                    <option value="3">Both</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ width: 180 }}
                    value={commentType}
                    onChange={(e) => {
                      handleFilterChange({ commentType: e.target.value });
                    }}
                  >
                    <option value="">Comments (All)</option>
                    <option value="1">Allow all</option>
                    <option value="2">Disable</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ width: 180 }}
                    value={scheduleType}
                    onChange={(e) => {
                      handleFilterChange({ scheduleType: e.target.value });
                    }}
                  >
                    <option value="">Schedule (All)</option>
                    <option value="1">Scheduled</option>
                    <option value="2">Not scheduled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={videoMapData.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "checkBox") {
                  return <Skeleton variant="circular" width={20} height={20} />;
                } else if (col.Header === "NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "VIDEO") {
                  return (
                    <div className="d-flex justify-content-center">
                      <Skeleton variant="square" sx={{ borderRadius: "10px" }} width={50} height={50} />
                    </div>
                  );
                } else if (col.Header === "ADDED BY") {
                  return (
                    <div className="d-flex align-items-center">
                      <Skeleton variant="square" sx={{ borderRadius: "10px" }} width={50} height={50} />
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
                      <Skeleton variant="circular" width={25} height={25} />
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
          handleSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          type={"server"}
        />
        <div className="mt-3">
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={limit}
            userTotal={totalShorts}
            setPage={(pageNumber) => updateParams({ page: pageNumber })}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  getShortsApi,
  deleteShort,
})(ManageShorts);
