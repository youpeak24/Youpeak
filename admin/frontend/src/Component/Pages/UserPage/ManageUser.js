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
import UserImage from "../../../assets/images/8.jpg";
import coin from "../../../assets/images/mcoin.png";
import {
  getUser,
  isActiveUser,
  deleteUser,
  togglePaymentStatus,
} from "../../store/user/user.action";
import $, { get } from "jquery";
import ToggleSwitch from "../../extra/ToggleSwitch";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function ManageUser(props) {
  const { startDate, endDate, multiButtonSelectData } = props;
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
  const { user, totalUser } = useSelector((state) => state.user);
  console.log("user", user);


  const { isLoading } = useSelector((state) => state.dialogue);
  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;
  const [data, setData] = useState();
  const [showURLs, setShowURLs] = useState([]);

  useEffect(() => {
    setData(user);
  }, [user]);


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
    Promise.resolve(props.isActiveUser(ids, "user", blockValue))
      .then((res) => {
        if (res?.data?.status) clearSelection();
      })
      .catch(() => { });
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
            const yes = res.isConfirmed
            if (yes) {
              Promise.resolve(
                props.deleteUser(selectCheckDataGetId, "user")
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
      Header: "USER",
      body: "userName",
      Cell: ({ row, index }) => (
        <div className="d-flex align-items-center">
          <LazyImage
            imageSrc={row?.image ? row?.image : UserImage}
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
    // {
    //   Header: "ID",
    //   body: "id",
    //   Cell: ({ row }) => (
    //     <span className="text-capitalize    cursorPointer">
    //       {row?.uniqueId}
    //     </span>
    //   ),
    // },

    {
      Header: "EMAIL",
      body: "email",
      Cell: ({ row }) => (
        <span className="text-lowercase    cursorPointer">{row?.email}</span>
      ),
    },
    {
      Header: "COIN",
      body: "coin",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span>{row?.coin || 0}</span>
        </div>
      ),
    },
    {
      Header: "PURCHASED COIN",
      body: "purchasedCoin",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span>{row?.purchasedCoin || 0}</span>
        </div>
      ),
    },
    {
      Header: "TOTAL REWARD COIN",
      body: "totalRewardCoin",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span>{row?.totalRewardCoin || 0}</span>
        </div>
      ),
    },

    {
      Header: "PAYMENT STATUS",
      body: "paymentStatus",
      Cell: ({ row }) => (
        <span
          className={`badge ${
            row?.paymentStatus ? "bg-success" : "bg-danger"
          } text-white px-2 py-1`}
          style={{ borderRadius: "6px", fontSize: "12px" }}
        >
          {row?.paymentStatus ? "Verified 🟢" : "Pending 🔴"}
        </span>
      ),
    },
    {
      Header: "VERIFY PAYMENT",
      body: "togglePaymentStatus",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.paymentStatus || false}
          onChange={() => handleTogglePaymentStatus(row)}
        />
      ),
    },
    {
      Header: "STATUS",
      body: "status",
      Cell: ({ row }) => <span>{row?.isBlock ? "Block" : "Unblock"}</span>,
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
    }

  ];

  useEffect(() => {
    dispatch(
      getUser(
        "realUser",
        page,
        limit,
        startDate,
        endDate,
        search || "",
        blockStatusForApi
      )
    );
  }, [dispatch, startDate, endDate, page, limit, search, actionPagination]);

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const handleTogglePaymentStatus = (row) => {
    const id = row?._id;
    props.togglePaymentStatus(id);
  };

  const handleIsActive = (row) => {

    const id = row?._id;
    const data = row?.isBlock === false ? true : false;
    props.isActiveUser(id, "user", data);
  };

  const handleDeleteUser = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed
          if (yes) {
            const id = row?._id;
            props.deleteUser(id, "user");
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

  return (
    <div>
      <div className="user-table real-user mb-3">
        <div className="user-table-top">

          <h5
            style={{
              fontWeight: "500",
              fontSize: "20px",
              marginBottom: "5px",
              marginTop: "5px",
            }}
          >
            User
          </h5>
          <Searching
            placeholder={"Search by name, id, email, channel Id"}
            type={"server"}
            serverSearching={handleServerSearch}
            setSearchData={setSearch}
            actionPaginationDataCustom={["All", "Block", "Unblock"]}
            actionPagination={actionPagination}
            setActionPagination={handleActionPaginationChange}
            paginationSubmitButton={paginationSubmitButton}
            isSubmitDisabled={isSubmitDisabled}
            value={search}
          />
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
                } else if (col.Header === "USER") {
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
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={limit}
          userTotal={totalUser}
          setPage={(pageNumber) => updateParams({ page: pageNumber })}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
export default connect(null, {
  getUser,
  isActiveUser,
  deleteUser,
  togglePaymentStatus,
})(ManageUser);
