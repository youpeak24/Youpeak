import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWithDrawRequest } from "../../store/withdraw/withdraw.action";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import Searching from "../../extra/Searching";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { IconEye, IconInfoCircle } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";
import dayjs from "dayjs";


const DeclinedRequest = (props) => {
  const { withdraw, total, withdrawType } = useSelector((state) => state.withdraw);
  const { defaultCurrency } = useSelector((state) => state.currency);
  const { isLoading } = useSelector((state) => state.dialogue);
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

  const handleViewReason = (row) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: { type: "viewReason", data: row },
    });
    sessionStorage.setItem(
      "dialogueData",
      JSON.stringify({ dialogue: true, type: "viewReason", dialogueData: row })
    );
  };

  useEffect(() => {
    setData([]);
    dispatch(getWithDrawRequest(3, page, limit, startDate, endDate, search || ""));
    dispatch(getDefaultCurrency());

  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (withdrawType === 3) {
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
          {row?.requestAmount}
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
      Header: "PAYMENT DATE",
      body: "paymentDate",
      Cell: ({ row }) => (
        <span className="text-nowrap">{dayjs(row?.paymentDate).format("MM/DD/YYYY hh:mm A") || "—"}</span>
      ),
    },

      {
      Header: "STATUS",
      body: "action",
      Cell: ({ row }) => <div className="action-button text-danger">Declined</div>,
    },

    {
      Header: "REASON",
      body: "reason",
      Cell: ({ row }) =>
        row?.reason ? (
          <span
            className="cursorPointer d-inline-flex align-items-center"
            onClick={() => handleViewReason(row)}
            title="View reason"
          >
            <IconEye size={20} className="text-secondary" />
          </span>
        ) : (
          <span>—</span>
        ),
    },

    {
      Header: "PAYMENT",
      body: "paymentGateway",
      Cell: ({ row }) => (
        <span
          className="cursorPointer d-inline-flex align-items-center"
          onClick={() => handlePaymentInfo(row)}
          title="View payment details"
        >
          <IconInfoCircle size={20} className="text-secondary" />
        </span>
      ),
    }
  ];
  return (
    <div>
      <div className="user-table real-user mb-3">
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
                } else if (col.Header === "PAYMENT" || col.Header === "REASON") {
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

export default DeclinedRequest;
