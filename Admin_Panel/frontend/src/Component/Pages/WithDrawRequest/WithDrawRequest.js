import React, { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import { useDispatch, useSelector } from "react-redux";
import { getWithDrawRequest } from "../../store/withdraw/withdraw.action";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import Button from "../../extra/Button";
import Searching from "../../extra/Searching";
import { ReactComponent as TrueIcon } from "../../../assets/icons/TrueArrow.svg";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";

import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { type } from "@testing-library/user-event/dist/type";
import Reason from "./Reason";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import defaultImage from "../../../assets/images/noimage.png";
import { IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import dayjs from "dayjs";
import { Skeleton } from "@mui/material";

const WithDrawRequest = (props) => {
  const { withdraw, total, withdrawType } = useSelector((state) => state.withdraw);

  const { defaultCurrency } = useSelector((state) => state.currency);
  const { isLoading } = useSelector((state) => state.dialogue);
  const { dialogueType } = useSelector((state) => state.dialogue);

  const dispatch = useDispatch();

  const { startDate, endDate } = props;

  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [data, setData] = useState([]);

  useEffect(() => {
    setData([]);
    dispatch(getWithDrawRequest(1, page, limit, startDate, endDate, search || ""));
    dispatch(getDefaultCurrency());
  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (withdrawType === 1) {
      setData(withdraw);
    }
  }, [withdraw, withdrawType]);



  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };



  const ManageUserData = [
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
      Cell: ({ row }) => (
        <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>
          {/* <img
        src={row?.userId?.image}
        width="50px"
        height="50px"
        alt="user"
        className="rounded-circle me-2"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultImage; // fallback image
        }}
      /> */}
          <LazyImage imageSrc={row?.userId?.image} width="50px" height="50px" />
          <div className="ms-3 ">
            {/* Nick Name */}
            <div className="fw-semibold text-start text-capitalize">
              {row?.userId?.fullName || "-"}
            </div>

            {/* Full Name */}
            <div className="text-muted small text-start text-capitalize">
              {row?.userId?.nickName || "-"}
            </div>
            <div className="text-muted small text-start text-capitalize">
              <UniqueIdCopy value={row?.userId?.uniqueId} placeholder="-" />
            </div>
          </div>
        </div>
      ),
    },

    {
      Header: `REQUEST AMOUNT(${defaultCurrency?.symbol ? defaultCurrency?.symbol : ""
        })`,
      body: "requestAmount",
      Cell: ({ row }) => (
        <span className="text-lowercase cursorPointer">
          {row?.requestAmount}{defaultCurrency?.symbol}
        </span>
      ),
    },
    {
      Header: "TRANSACTION ID",
      body: "uniqueId",
      Cell: ({ row }) => (
        <span className="text-nowrap">{row?.uniqueId || "—"}</span>
      ),
    },
    {
      Header: "CHANNEL Name",
      body: "channelName",
      Cell: ({ row }) => (
        <span className="text-capitalize  text-nowrap">{row?.channelName}</span>
      ),
    },
    {
      Header: "CHANNEL ID",
      body: "channelId",
      Cell: ({ row }) => (
        <span className="text-capitalize  text-nowrap">{row?.channelId}</span>
      ),
    },
    {
      Header: "REQUEST DATE",
      body: "requestDate",
      Cell: ({ row }) => (
        <span className="text-nowrap">{dayjs(row?.requestDate).format("MM/DD/YYYY hh:mm A") || "—"}</span>
      ),
    },

    {
      Header: "PAYMENT",
      body: "infoPayment",
      Cell: ({ row }) => (
        <span
          className="cursorPointer d-inline-flex align-items-center"
          onClick={() => handlePaymentInfo(row)}
          title="View payment details"
        >
          <IconInfoCircle size={20} className="text-secondary" />
        </span>
      ),
    },

    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          {/* <Button
            btnName={`Pay`}
            newClass={`fw-bolder bg-success text-white w-70`}
            onClick={() => handleEdit(row, "pay")}
          />
          <Button
            btnName={`Decline`}
            newClass={`fw-bolder bg-danger text-white w-70`}
            onClick={() => handleDecline(row, "decline")}
          /> */}

          <button className="btn btn-sm" onClick={() => handleEdit(row, "pay")}>
            <IconCheck className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDecline(row, "decline")}>
            <IconX className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

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

  const handleDecline = (row, type) => {

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

  const handlePaymentInfo = (row) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: { type: "info", data: row },
    });
    sessionStorage.setItem(
      "dialogueData",
      JSON.stringify({ dialogue: true, type: "info", dialogueData: row })
    );
  };

  return (
    <div>
      <div className="user-table real-user mb-3">
        {dialogueType == "decline" && <Reason />}

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
                Withdrawal Request
              </h5>
            </div>
            <Searching
              placeholder={"Search by user's id, name"}
              type={"server"}
              serverSearching={handleServerSearch}
              setSearchData={setSearch}
              className={"d-flex justify-content-end w-100"}
              label={"Search by user's id, name"}
              hideActionDropdown={true}
              actionShow={false}
              value={search}
            />
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={ManageUserData.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "NO") {
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
                } else if (col.Header === "ACTION") {
                  return (
                    <div className="action-button">
                      <Skeleton variant="circular" width={25} height={25} />
                      <Skeleton variant="circular" width={25} height={25} className="ms-2" />
                    </div>
                  );
                } else if (col.Header === "PAYMENT") {
                  return (
                    <div className="d-flex justify-content-center">
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
          type={"server"}
        />
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={limit}
          userTotal={total}
          setPage={(pageNumber) => updateParams({ page: pageNumber })}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default WithDrawRequest;
