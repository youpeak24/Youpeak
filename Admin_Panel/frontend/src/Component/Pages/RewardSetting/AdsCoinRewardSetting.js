import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteReward,
  editSetting,
  getAdsReward,
  getSettingApi,
} from "../../store/setting/setting.action";
import Button from "../../extra/Button";
import Table from "../../extra/Table";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import AddIcon from "@mui/icons-material/Add";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import AddReward from "../../dialogue/AddReward";
import { warning } from "../../../util/Alert";
import Input from "../../extra/Input";

import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import coin from "../../../../src/assets/images/mcoin.png";
import { Skeleton } from "@mui/material";

const AdsCoinRewardSetting = () => {
  const { rewardData, settingData } = useSelector((state) => state.setting);
  const { dialogue, dialogueType, dialogueData, isLoading } = useSelector(
    (state) => state.dialogue
  );

  const dispatch = useDispatch();

  const [data, setData] = useState();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const [maxAdPerDay, setMaxAdPerDay] = useState();

  const [error, setError] = useState({
    maxAdPerDay: "",
  });

  useEffect(() => {
    dispatch(getAdsReward());
    dispatch(getSettingApi());
  }, []);

  useEffect(() => {
    setMaxAdPerDay(settingData?.maxAdPerDay);
  }, [settingData]);

  useEffect(() => {
    setData(rewardData);
  }, [rewardData]);

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

  const handleDeleteVideo = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed;
          if (yes) {
            const id = row?._id;
            dispatch(deleteReward(id));
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const withdrawTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }) => <span>{(page - 1) * size + index + 1}</span>,
    },
    {
      Header: "LABEL",
      body: "adLabel",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.adLabel}</span>
      ),
    },
    {
      Header: "COIN EARNED FROM AD",
      body: "coinEarnedFromAd",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span className="text-capitalize">{row?.coinEarnedFromAd}</span>
        </div>
      ),
    },

    {
      Header: "AD INTERVAL (SECOND)",
      body: "adDisplayInterval",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.adDisplayInterval}</span>
      ),
    },

    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button
            className="btn btn-sm"
            onClick={() => handleEdit(row, "reward")}
          >
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => handleDeleteVideo(row)}
          >
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {

    const maxAdPerDayValue = parseInt(maxAdPerDay);

    if (maxAdPerDay === "" || maxAdPerDayValue <= 0) {
      let error = {};

      if (maxAdPerDay === "") error.maxAdPerDay = "Amount Is Required !";

      if (maxAdPerDayValue <= 0) error.maxAdPerDay = "Amount Invalid !";

      return setError({ ...error });
    } else {
      let settingDataSubmit = {
        maxAdPerDay: parseInt(maxAdPerDay),
      };
      dispatch(editSetting(settingData?._id, settingDataSubmit));
    }
  };

  return (
    <div className="">
      {dialogueType == "reward" && <AddReward />}
      <div className="">
        <div className="">
          <div className="card1">
            <div className="align-items-center cardHeader d-flex justify-content-between px-4 py-2">
              <div className="">
                <h5 className="mb-0">Ads Coin Reward</h5>
              </div>
              <div className="">
                <Button
                  btnName={"Submit"}
                  type={"button"}
                  onClick={handleSubmit}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "88px",
                    marginLeft: "10px",
                  }}
                />
              </div>
            </div>
            <div className="">
              <div className=" withdrawal-input px-4 py-2">
                <Input
                  label={"Maximum Ads Per Day"}
                  name={"maxAdPerDay"}
                  type={"number"}
                  value={maxAdPerDay}
                  errorMessage={error.maxAdPerDay && error.maxAdPerDay}
                  placeholder={"Enter Amount"}
                  onChange={(e) => {
                    setMaxAdPerDay(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        maxAdPerDay: `Maximum Ads Per Day Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        maxAdPerDay: "",
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className=" user-table">
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
                Ads Coin
              </h5>
            </div>
            <div className="col-6 d-flex justify-content-end">
              <Button
                btnIcon={<IconPlus height={18} width={18} />}
                newClass={""}
                btnName={"New"}
                onClick={() => handleOpenNew("reward")}
              />
            </div>
          </section>
        </div>
        <div className="">
          <Table
            data={isLoading ? Array(10).fill({}) : data}
            mapData={withdrawTable.map((col) => ({
              ...col,
              Cell: (props) => {
                if (isLoading) {
                  if (col.Header === "NO") {
                    return <Skeleton variant="text" width="20px" />;
                  } else if (col.Header === "ACTION") {
                    return (
                      <div className="action-button">
                        <Skeleton variant="circular" width={25} height={25} />
                        <Skeleton variant="circular" width={25} height={25} className="ms-2" />
                      </div>
                    );
                  } else if (col.Header === "COIN EARNED FROM AD") {
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
        </div>
      </div>
    </div>
  );
};

export default AdsCoinRewardSetting;
