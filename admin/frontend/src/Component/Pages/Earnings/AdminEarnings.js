import React, { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import Searching from "../../extra/Searching";
import { useDispatch, useSelector } from "react-redux";
import { cleanData, getAdminEarnings } from "../../store/admin/admin.action";
import dayjs from "dayjs";
import dummy from "../../../assets/images/dummy.png"
import { getDefaultCurrency } from "../../store/currency/currency.action";
import LazyImage from "../../../common/ImageFallback";
import { PAYMENT_GATEWAYS } from "../../../util/paymentGateways";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

const AdminEarnings = (props) => {
  const { earning, total, totalEarning } = useSelector((state) => state.admin);
  const { defaultCurrency } = useSelector((state) => state.currency);
  const { isLoading } = useSelector((state) => state.dialogue);
  const { startDate, endDate } = props;

  const dispatch = useDispatch();

  const [data, setData] = useState();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
    paymentGateway: "All",
  });
  const { page, limit, search, paymentGateway } = params;
  const [, setSearch] = useState(search || "");
  const [showURLs, setShowURLs] = useState([]);

  useEffect(() => {
    dispatch(getAdminEarnings(startDate, endDate, page, limit, search, paymentGateway));
    // dispatch(getDefaultCurrency());

    return () => {
      dispatch(cleanData())
    };
  }, [dispatch, startDate, endDate, page, limit, search, paymentGateway]);

  useEffect(() => {
    setData(earning);
  }, [earning]);



  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

  const earningTable = [
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
      Header: "USER NAME",
      body: "fullName",
      Cell: ({ row, index }) => (
        // <div
        //   className="d-flex align-items-center "
        //   style={{ cursor: "pointer" }}
        //   onClick={() => handleEdit(row, "manageUser")}
        // >

        //   <img src={showURLs[index]} width="40px" height="40px"
        //     onError={(e) => {
        //       e.target.onerror = null;
        //       e.target.src = {dummy};
        //     }}
        //   />
        //   <span className="text-capitalize   cursorPointer text-nowrap">
        //     {row?.fullName}
        //   </span>
        // </div>
        <div
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
        // onClick={() => handleEdit(row, "manageUser")}
        >
          {/* <img
            src={row?.image}
            width="50px"
            height="50px"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = dummy;
            }}
          /> */}

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
              <UniqueIdCopy value={row?.userUniqueId} placeholder="-" />
            </div>
          </div>
        </div>
      ),
    },

    {
      Header: "PAYMENT GATEWAY",
      body: "paymentGateway",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.paymentGateway}</span>
      ),
    },

    {
      Header: "VALIDITY",
      body: "validity",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.validity}</span>
      ),
    },
    {
      Header: `AMOUNT (${defaultCurrency?.symbol})`,
      body: "amount",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.amount + " " + defaultCurrency?.symbol}
        </span>
      ),
    },

    {
      Header: "VALIDITY TYPE",
      body: "validityType",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.validityType ? row?.validityType : "-"}</span>
      ),
    },
    {
      Header: "CREATED AT",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {dayjs(row.createdAt).format("MM/DD/YYYY hh:mm A")}
        </span>
      ),
    },
  ];
  return (
    <div className=" ">
      <div className=" user-table">
        {/* <div className="row align-items-center mb-2 p-3 ml-1">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6">
            <h5
              style={{
                fontWeight: "500",
                fontSize: "20px",
              }}
            >
              Premium Plan Earning
            </h5>
          </div>
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn d-flex justify-content-end">
            <h4
              style={{
                fontWeight: "500",
                fontSize: "20px",
                marginBottom: "0px",
                marginTop: "5px",
                padding: "3px",
              }}
            >
              Total Admin Earning :{" "}
              {totalEarning + " " + defaultCurrency?.symbol}
            </h4>
          </div>
        </div> */}
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
               Premium Plan Earning
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
        <div className="">
          <Table
            data={isLoading ? Array(10).fill({}) : data}
            mapData={earningTable.map((col) => ({
              ...col,
              Cell: (props) => {
                if (isLoading) {
                  if (col.Header === "NO") {
                    return <Skeleton variant="text" width="20px" />;
                  } else if (col.Header === "USER NAME") {
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
              userTotal={total}
              setPage={(pageNumber) => updateParams({ page: pageNumber })}
              handleRowsPerPage={handleRowsPerPage}
              handlePageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEarnings;
