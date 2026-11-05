import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import AddIcon from "@mui/icons-material/Add";
import NewTitle from "../../extra/Title"
import { connect, useDispatch, useSelector } from "react-redux";
import { getCoinPlan, isActiveCoinPlan, isPopularCoinPlan } from "../../store/coinPlan/coinPlan.action";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import { useEffect, useState } from "react";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";

import CreatePlan from "../../dialogue/CreatePlan";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg"
import coin from "../../../../src/assets/images/mcoin.png"   // 👈 replace with your coin image path
import ToggleSwitch from "../../extra/ToggleSwitch"
import dayjs from "dayjs";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { PAYMENT_GATEWAYS } from "../../../util/paymentGateways";
import { Skeleton } from "@mui/material";
const CoinPlanTable = (props) => {
  const [data, setData] = useState();
  const coinPlanData = useSelector((state) => state.coinPlan);
  const { dialogue, dialogueType, dialogueData, isLoading } = useSelector(
    (state) => state.dialogue
  );
  const { defaultCurrency } = useSelector((state) => state.currency);


  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [paymentGateway, setPaymentGateway] = useState(
    sessionStorage.getItem("coinPlanPaymentGatewayFilter") || "All"
  );

  useEffect(() => {
    dispatch(getCoinPlan(paymentGateway));
    dispatch(getDefaultCurrency());
  }, [dispatch, page, size, paymentGateway]);

  useEffect(() => {
    setData(coinPlanData?.coinPlanData);
  }, [coinPlanData?.coinPlanData]);

  const planTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }) => <span>{(page - 1) * size + index + 1}</span>,
    },

    // {
    //   Header: "Image",
    //   body: "Image",
    //   Cell: ({ row }) => (
    //     <span className="text-capitalize">
    //       <img src={row?.icon} alt={row?.planBenefit} height={50} width={50} />
    //     </span>
    //   ),
    // },
    {
      Header: `AMOUNT (${defaultCurrency?.symbol})`,
      body: "amount",
      Cell: ({ row }) => {
        return <span className="text-capitalize">{row?.amount || "-"} {defaultCurrency?.symbol}</span>;
      },
    },
    {
      Header: "COIN",
      body: "coin",
      Cell: ({ row }) => (
        <div
          className="d-flex align-items-center justify-content-center gap-2 "
        >
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span className="text-capitalize">
            {row?.coin ?? "-"}
          </span>
        </div>
      ),
    },
    {
      Header: "EXTRA COIN",
      body: "extracoin",
      Cell: ({ row }) => (
        // <span className="text-capitalize">{row?.extraCoin || "-"}</span>
        <div className="d-flex align-items-center justify-content-center  gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span className="text-capitalize">
            {row?.extraCoin ?? "-"}
          </span>
        </div>
      ),
    },

    {
      Header: "ACTIVE",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isActive}
          onChange={() => handleIsActive(row)}
        />
      ),
    },
    {
      Header: "POPULAR",
      body: "isPopular",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isPopular}
          onChange={() => handleIsPopular(row)}
        />
      ),
    },
    {
      Header: "CREATE AT",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("MM/DD/YYYY hh:mm A") : ""}
        </span>
      ),
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          {/* <Button
            btnIcon={<EditIcon />}
            onClick={() => handleEdit(row, "coinPlanAdd")}
          /> */}
          <button className="btn btn-sm" onClick={() => handleEdit(row, "coinPlanAdd")}>
            <IconEdit className="text-secondary" size={20} />
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


  const handleIsActive = (row) => {

    const id = row?._id;
    const data = row?.isActive === false ? true : false;
    props.isActiveCoinPlan(id, data);
  };
  const handleIsPopular = (row) => {

    const id = row?._id;
    const data = row?.isPopular === false ? true : false;
    props.isPopularCoinPlan(id, data);
  };

  useEffect(() => {
    dispatch(getCoinPlan(paymentGateway));
    dispatch(getDefaultCurrency());
  }, [dispatch, paymentGateway]);

  return (
    <div className="  userPage ">
      {dialogueType == "coinPlanAdd" && <CreatePlan />}
      {/* <div className="dashboardHeader primeHeader mb-3 p-0">
        <NewTitle
          dayAnalyticsShow={false}
          titleShow={true}
          name={`Coin Plan`}
        />
      </div> */}
      <div className="user-table">
        <div className="user-table-top">
          <section className="d-flex justify-content-between align-items-center w-100">
            <div className="col-6">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                }}
                className="m-0"
              >
                Coin Plan
              </h5>
            </div>
            <div className="col-6 d-flex justify-content-end">

              <Button
                btnIcon={<IconPlus width={18} height={18} />}
                newClass={""}
                btnName={"New"}
                onClick={() => handleOpenNew("coinPlanAdd")}
              />
            </div>
          </section>
        </div>
        <div className="">
          <Table
            data={isLoading ? Array(10).fill({}) : coinPlanData?.coinPlanData}
            mapData={planTable.map((col) => ({
              ...col,
              Cell: (props) => {
                if (isLoading) {
                  if (col.Header === "NO") {
                    return <Skeleton variant="text" width="20px" />;
                  } else if (col.Header === "ACTIVE" || col.Header === "POPULAR") {
                    return (
                      <div className="d-flex justify-content-center">
                        <Skeleton variant="rectangular" width={40} height={20} style={{ borderRadius: "10px" }} />
                      </div>
                    );
                  } else if (col.Header === "ACTION") {
                    return (
                      <div className="action-button">
                        <Skeleton variant="circular" width={25} height={25} />
                      </div>
                    );
                  } else if (col.Header === "COIN" || col.Header === "EXTRA COIN") {
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
            PerPage={size}
            Page={page}
            type={"client"}
          />
          {/* <Pagination
            type={"client"}
            activePage={page}
            rowsPerPage={size}
            userTotal={coinPlanData?.coinPlanData?.length}
            setPage={setPage}
            setData={setData}
            data={data}
            actionShow={false}

          /> */}
        </div>
      </div>
    </div>
  )
}
// export default CoinPlanTable;
export default connect(null, {
  isActiveCoinPlan,
  isPopularCoinPlan
})(CoinPlanTable);