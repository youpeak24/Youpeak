import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMonetizationRequest } from "../../store/monetization/monetization.action";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import Searching from "../../extra/Searching";
import defaultImage from "../../../assets/images/noimage.png";
import LazyImage from "../../../common/ImageFallback";
import dayjs from "dayjs";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";


const DeclinedRequest = (props) => {
  const { monetization, total, monetizationType } = useSelector((state) => state.monetization);
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
  const [showURLs, setShowURLs] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    setData([]);
    dispatch(getMonetizationRequest(3, page, limit, startDate, endDate, search || ""));
  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (monetizationType === 3) {
      setData(monetization);
    }
  }, [monetization, monetizationType]);

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
      Header: "TOTAL WATCH TIME (MINUTES)",
      body: "totalWatchTime",
      Cell: ({ row }) => (
        <span className="text-lowercase cursorPointer">
          {row?.totalWatchTime}
        </span>
      ),
    },
    {
      Header: "TOTAL WATCH TIME (HOURS)",
      body: "totalWatchTimeInHours",
      Cell: ({ row }) => (
        <span className="text-lowercase cursorPointer">
          {row?.totalWatchTimeInHours}
        </span>
      ),
    },
    {
      Header: "CREATEDAT",
      body: "createdAt",
      Cell: ({ row }) => <span>{dayjs(row?.requestDate || row?.date).format("MM/DD/YYYY hh:mm A")}</span>,
    },

    {
      Header: "STATUS",
      body: "action",
      Cell: ({ row }) => <div className="action-button text-danger">Declined</div>,
    },
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
                Monetization Request
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
                } else if (col.Header === "STATUS") {
                  return <Skeleton variant="text" width="60px" />;
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
