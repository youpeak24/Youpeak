import React, { useEffect, useState } from "react";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import { connect, useDispatch, useSelector } from "react-redux";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import Searching from "../../extra/Searching";
import { warning } from "../../../util/Alert";
import AddIcon from "@mui/icons-material/Add";
import UserImage from "../../../assets/images/dummy.png";
import {
  getFakeUser,
  isActiveUser,
  deleteUser,
} from "../../store/user/user.action";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import $, { get } from "jquery";
import ToggleSwitch from "../../extra/ToggleSwitch";
import CreateChannel from "../../dialogue/CreateChannel";
import { Skeleton, Tooltip } from "@mui/material";
import { IconCircleDashedCheck, IconCircleDashedPlus, IconCirclePlus, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";

function FakeUser(props) {
  const { startDate, endDate } = props;
  const dispatch = useDispatch();
  const [age, setAge] = useState("");
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [actionPagination, setActionPagination] = useState("all");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const { fakeUser, totalUsersAddByAdmin } = useSelector((state) => state.user);
  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;


  const [data, setData] = useState();
  const [showURLs, setShowURLs] = useState([]);
  const { dialogue, dialogueType, dialogueData, isLoading } = useSelector(
    (state) => state.dialogue
  );

  useEffect(() => {
    setData(fakeUser);
  }, [fakeUser]);

  // $(document).ready(function () {
  //   $("img").bind("error", function () {
  //     // Set the default image
  //     $(this).attr("src", UserImage);
  //   });
  // });

  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleActionPaginationChange = (value) => {
    setActionPagination(value);
    updateParams({ page: 1 });
  };

  const blockStatusForApi =
    actionPagination === "block"
      ? "true"
      : actionPagination === "unblock"
        ? "false"
        : "";

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

  const clearSelection = () => {
    setSelectCheckData([]);
    setSelectAllChecked(false);
  };

  const runBulkBlockUnblock = (ids, blockValue) => {
    if (!ids?.length) return;
    Promise.resolve(props.isActiveUser(ids, "fakeUser", blockValue))
      .then((res) => {
        if (res?.data?.status) clearSelection();
      })
      .catch(() => { });
  };

  const handleCreateChannel = (row, type) => {

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
  const paginationSubmitButton = () => {

    const selectCheckDataGetId = selectCheckData?.map((item) => item?._id);
    if (!selectCheckDataGetId?.length) return;

    const isUserBlocked = (row) =>
      row?.isBlock === true || row?.isBlock === "true";

    const getLatestRow = (id) => {
      const found = data?.find((r) => r?._id === id);
      return found ? found : selectCheckData.find((r) => r?._id === id);
    };

    const toBlockIds = selectCheckData
      .map((row) => getLatestRow(row?._id))
      .filter((row) => !isUserBlocked(row))
      .map((row) => row._id);

    const toUnblockIds = selectCheckData
      .map((row) => getLatestRow(row?._id))
      .filter((row) => isUserBlocked(row))
      .map((row) => row._id);

    if (actionPagination === "delete") {
      const data = warning();
      data
        .then((res) => {
          if (res) {
            const yes = res.isConfirmed;
            if (yes) {
              Promise.resolve(
                props.deleteUser(selectCheckDataGetId, "fakeUser")
              )
                .then((res) => {
                  if (res?.data?.status) clearSelection();
                })
                .catch(() => { });
            }
          }
        })
        .catch((err) => console.log(err));
      return;
    }

    if (actionPagination === "block" && toBlockIds.length > 0) {
      runBulkBlockUnblock(toBlockIds, true);
    } else if (actionPagination === "unblock" && toUnblockIds.length > 0) {
      runBulkBlockUnblock(toUnblockIds, false);
    } else if (actionPagination === "all") {
      if (toBlockIds.length > 0) {
        runBulkBlockUnblock(toBlockIds, true);
      } else if (toUnblockIds.length > 0) {
        runBulkBlockUnblock(toUnblockIds, false);
      }
    }
  };

  const ManageUserData = [
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
      Header: "USERNAME",
      body: "userName",
      Cell: ({ row, index }) => (
        <div
          className="d-flex align-items-center"
        // style={{ cursor: "pointer" }}
        // onClick={() => handleEdit(row, "manageUser")}
        >
          {/* <img src={row?.image} width="50px" height="50px" /> */}
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
      Header: "EMAIL",
      body: "email",
      Cell: ({ row }) => (
        <span className="text-lowercase    cursorPointer">{row?.email}</span>
      ),
    },
    {
      Header: "IP ADDRESS",
      body: "callEndReason",
      class: " ",
      Cell: ({ row }) => <span>{row?.ipAddress}</span>,
    },
    {
      Header: "STATUS",
      body: "status",
      Cell: ({ row }) => <span>{row?.isBlock ? "Block" : "UnBlock"}</span>,
    },
    {
      Header: "BLOCK",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isBlock}
          onChange={() => handleIsActive(row)}
        />
      ),
    },
    {
      Header: "CREATE CHANNEL",
      body: "status",
      Cell: ({ row }) => (
        <span className="text-uppercase">
          <div className="action-button create-channel-icon">
            {row?.isChannel === true ? (
              <>
                <IconCircleDashedCheck className="text-success" />
              </>
            ) : (
              <>
                <IconCircleDashedPlus className="text-secondary cursor-pointer" onClick={() => handleCreateChannel(row, "createChannel")} />
              </>
            )}
          </div>
        </span>
      ),
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button className="btn btn-sm" onClick={() => handleEdit(row, "manageUser")}>
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDeleteUser(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    dispatch(
      getFakeUser(
        page,
        limit,
        startDate,
        endDate,
        "addByAdmin",
        search || "",
        blockStatusForApi
      )
    );
  }, [dispatch, startDate, endDate, limit, page, search, actionPagination]);

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const handleIsActive = (row) => {

    const id = row?._id;
    const type = "fakeUser";
    const data = row?.isBlock === false ? true : false;
    props.isActiveUser(id, type, data);
  };

  const handleDeleteUser = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed;
          if (yes) {
            const id = row?._id;
            props.deleteUser(id, "fakeUser");
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const handleFilterData = (filteredData) => {
    if (typeof filteredData === "string") {
      handleFilterChange({ search: filteredData });
    } else {
      setData(filteredData);
    }
  };

  const handleOpenNew = (type) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: {
        type: type,
      },
    });

    let dialogueData_ = {
      dialogue: true,
      type: type,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };

  return (
    <div>
      {dialogueType == "createChannel" && <CreateChannel />}
      <div className="user-table fake-user mb-3">
        <div className="user-table-top">
          <h5
            style={{
              fontWeight: "500",
              fontSize: "20px",
              marginBottom: "5px",
              marginTop: "5px",
            }}
          >
            Fake User
          </h5>

          <div className="d-flex ">
            <Searching
              label={
                " Search for ID, Keyword, E-mail, Username, First Name, LastName"
              }
              placeholder={"Search by name, id, email, channel Id"}
              type={"server"}
              serverSearching={handleServerSearch}
              setSearchData={setSearch}
              actionPaginationDataCustom={["All", "Block", "Unblock", "Delete"]}
              actionPagination={actionPagination}
              setActionPagination={handleActionPaginationChange}
              paginationSubmitButton={paginationSubmitButton}
              isSubmitDisabled={isSubmitDisabled}
              value={search}
            />
            <Button
              btnIcon={<IconPlus size={20} />}
              btnName={"New"}
              newClass={"ms-2"}
              onClick={() => handleOpenNew("fakeUserAdd")}
            />
            {/* <Tooltip title="Add New" placement="top" arrow>
              <div className="submit-btn-multipleSelect" onClick={() => handleOpenNew("fakeUserAdd")}>
                <IconCirclePlus  className="text-secondary cursor-pointer" size={25} />
              </div>
            </Tooltip> */}
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={ManageUserData.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "checkBox") {
                  return <Skeleton variant="circular" width={20} height={20} />;
                } else if (col.Header === "NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "USERNAME") {
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
                } else if (col.Header === "BLOCK") {
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
        <div>
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={limit}
            userTotal={totalUsersAddByAdmin}
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
  getFakeUser,
  isActiveUser,
  deleteUser,
})(FakeUser);
