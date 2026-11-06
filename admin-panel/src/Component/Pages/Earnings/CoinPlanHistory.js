import React, { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { getAdminEarnings, getCoinPlanEarnings } from "../../store/admin/admin.action";
import dayjs from "dayjs";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import { useNavigate } from "react-router-dom";
import coin from "../../../../src/assets/images/mcoin.png";
import { Skeleton } from "@mui/material";



const CoinPlanHistory = () => {
    const { earning, total } = useSelector((state) => state.admin);
    const { defaultCurrency } = useSelector((state) => state.currency);
    const { isLoading } = useSelector((state) => state.dialogue);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(20);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");

    useEffect(() => {
        dispatch(getCoinPlanEarnings(startDate, endDate, page, size, "All"));
        dispatch(getDefaultCurrency());
    }, [dispatch, startDate, endDate, page, size]);

    // Was reading location?.state?.data?.coinPlanPurchase — the sidebar
    // links straight here with no router state, so `data` was always
    // undefined and the table rendered empty despite the fetch above
    // succeeding. `earning` is the actual Redux state that fetch populates.
    const data = earning;

    const handlePageChange = (pageNumber) => {
        setPage(pageNumber);
    };

    const handleRowsPerPage = (value) => {
        setPage(1);
        setSize(value);
    };

    const earningTable = [
        {
            Header: "NO",
            body: "no",
            Cell: ({ index }) => (
                <span className="  text-nowrap">
                    {(page - 1) * size + parseInt(index) + 1}
                </span>
            ),
        },

        {
            Header: "UNIQUEID",
            body: "uniqueId",
            Cell: ({ row }) => (
                <span className="text-capitalize">{row?.uniqueId}</span>
            ),
        },
        {
            Header: "COIN",
            body: "coin",
            Cell: ({ row }) => (
                <div className="d-flex align-items-center justify-content-center gap-2">
                    <img
                        src={coin}
                        alt="coin"
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span className="text-capitalize">
                        {row?.coin}
                    </span>
                </div>
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
            Header: "PAYMENT GATEWAY",
            body: "paymentGateway",
            Cell: ({ row }) => (
                <span className="text-capitalize">{row?.paymentGateway}</span>
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
        <div className="userPage withdrawal-page">
            <div className="dashboardHeader primeHeader mb-3 p-0">
                <NewTitle
                    dayAnalyticsShow={true}
                    // titleShow={true}
                    setEndDate={setEndDate}
                    setStartDate={setStartDate}
                    startDate={startDate}
                    endDate={endDate}
                // name={`Coin Plan Earning`}
                />
            </div>
            <div className=" user-table">
                <div className="user-table-top">

                    <h5 className="m-0"
                        style={{
                            fontWeight: "500",
                            fontSize: "20px",
                        }}
                    >
                        Coin Plan Purchase History
                    </h5>
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
                                    } else if (col.Header === "COIN") {
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
                        serverPerPage={size}
                        serverPage={page}
                        type={"server"}
                    />
                    <div className="">
                        <Pagination
                            type={"server"}
                            activePage={page}
                            actionShow={false}
                            rowsPerPage={size}
                            userTotal={total}
                            setPage={setPage}
                            handleRowsPerPage={handleRowsPerPage}
                            handlePageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoinPlanHistory;
