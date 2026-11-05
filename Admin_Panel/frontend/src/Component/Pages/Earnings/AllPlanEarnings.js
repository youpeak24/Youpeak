import React, { useEffect, useState } from "react";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import Searching from "../../extra/Searching";
import { useDispatch, useSelector } from "react-redux";
import {
  cleanAllPlanEarning,
  getAllPlanEarnings,
} from "../../store/admin/admin.action";
import dayjs from "dayjs";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import LazyImage from "../../../common/ImageFallback";
import coin from "../../../assets/images/mcoin.png";
import { PAYMENT_GATEWAYS } from "../../../util/paymentGateways";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

const AllPlanEarnings = (props) => {
  const { startDate, endDate } = props;

  const {
    allPlanEarning,
    allPlanTotal,
    allPlanTotalEarning,
    allPlanError,
    isLoading,
  } = useSelector((state) => state.admin);

  const { isLoading: dialogueLoading } = useSelector((state) => state.dialogue);

  const { defaultCurrency } = useSelector((state) => state.currency);

  const dispatch = useDispatch();

  const [data, setData] = useState([]);
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
    paymentGateway: "All",
  });
  const { page, limit, search, paymentGateway } = params;
  const [, setSearch] = useState(search || "");

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllPlanEarnings(startDate, endDate, page, limit, search, paymentGateway));

    return () => {
      dispatch(cleanAllPlanEarning());
    };
  }, [dispatch, startDate, endDate, page, limit, search, paymentGateway]);

  useEffect(() => {
    setData(allPlanEarning || []);
  }, [allPlanEarning]);

  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const getPlanTypeLabel = (row) => {
    const type = row?.type;

    if (type === 8 || type === "8") {
      return "Coin Plan";
    }
    if (type === 11 || type === "11") {
      return "VIP Plan";
    }

    return row?.planType || row?.planName || "-";
  };

  const earningTable = [
    {
      Header: "NO",
      body: "no",
      Cell: ({ index }) => (
        <span className="text-nowrap">
          {(page - 1) * limit + parseInt(index, 10) + 1}
        </span>
      ),
    },
    {
      Header: "USERNAME",
      body: "userName",
      Cell: ({ row }) => {
        const user = row?.user || row;
        return (
          <div className="d-flex align-items-center">
            <LazyImage imageSrc={user?.image} width="50px" height="50px" />
            <div className="ms-3 ">
              {/* Nick Name */}
              <div className="fw-semibold text-start text-capitalize">
                {user?.fullName || "-"}
              </div>

              {/* Full Name */}
              <div className="text-muted small text-start text-capitalize">
                {user?.nickName || "-"}
              </div>

              <div className="text-muted small text-start text-capitalize"> <UniqueIdCopy value={user?.userUniqueId} placeholder="-" /></div>
            </div>
          </div>
        );
      },
    },
    {
      Header: "PLAN TYPE",
      body: "planType",
      Cell: ({ row }) => (
        <span className="text-capitalize">{getPlanTypeLabel(row)}</span>
      ),
    },
    {
      Header: "TRANSACTION ID",
      body: "uniqueId",
      Cell: ({ row }) => (
        <span>{row?.uniqueId || row?.transactionId || "-"}</span>
      ),
    },
    // {
    //   Header: "COINS",
    //   body: "coin",
    //   Cell: ({ row }) => (
    //     <div className="d-flex align-items-center justify-content-center gap-2">
    //       <img
    //         src={coin}
    //         alt="coin"
    //         style={{ width: "20px", height: "20px" }}
    //       />
    //       <span>{row?.coin ?? "-"}</span>
    //     </div>
    //   ),
    // },
    {
      Header: "PAYMENT GATEWAY",
      body: "paymentGateway",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.paymentGateway}</span>
      ),
    },
    {
      Header: "COINS",
      body: "coin",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span>{row?.coin}</span>
        </div>
      ),
    },

    {
      Header: "REWARD COINS",
      body: "rewardCoins",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span>{row?.rewardCoins}</span>
        </div>
      ),
    },
    {
      Header: `AMOUNT (${defaultCurrency?.symbol})`,
      body: "amount",
      Cell: ({ row }) => (
        <span>
          {row?.amount} {defaultCurrency?.symbol}
        </span>
      ),
    },


    {
      Header: "DATE",
      body: "date",
      Cell: ({ row }) => (
        <span>
          {dayjs(row?.createdAt || row?.date).format("MM/DD/YYYY hh:mm A")}
        </span>
      ),
    },
  ];

  return (
    <div className="">
      <div className="user-table">
        <div className="user-table-top">
          <div className="row align-items-center w-100 m-0">
            <div className="col-12 col-md-4 mb-3 mb-md-0 p-0">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                }}
                className="m-0"
              >
               All Plan Earning
              </h5>
            </div>

            <div className="col-12 col-md-8 p-0">
              <div className="d-flex flex-column flex-sm-row justify-content-md-end gap-2 w-100">
                <select
                  className="form-select"
                  style={{ maxWidth: "100%" }}
                  value={paymentGateway}
                  onChange={(e) => {
                    handleFilterChange({ paymentGateway: e.target.value });
                  }}
                >
                  {PAYMENT_GATEWAYS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>

                <div className="w-100" style={{ maxWidth: "100%" }}>
                  <Searching
                    placeholder={"Search by id, name, payment gateway"}
                    type={"server"}
                    serverSearching={handleServerSearch}
                    setSearchData={setSearch}
                    value={search}
                    actionShow={false}
                    inline={true}
                    inputMaxWidth="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>



        <Table
          data={dialogueLoading ? Array(10).fill({}) : data}
          mapData={earningTable.map((col) => ({
            ...col,
            Cell: (props) => {
              if (dialogueLoading) {
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
                } else if (col.Header === "COINS" || col.Header === "REWARD COINS") {
                  return (
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="text" width="40px" height={20} />
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
        <div className="">
          <Pagination
            type={"server"}
            activePage={page}
            actionShow={false}
            rowsPerPage={limit}
            userTotal={allPlanTotal}
            setPage={(pageNumber) => updateParams({ page: pageNumber })}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AllPlanEarnings;

