import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteDailyReward,
  getDailyReward,
} from "../../store/setting/setting.action";
import Button from "../../extra/Button";
import Table from "../../extra/Table";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import AddIcon from "@mui/icons-material/Add";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import AddReward from "../../dialogue/AddReward";
import AddDailyReward from "../../dialogue/AddDailyReward";
import { warning } from "../../../util/Alert";

import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import coin from "../../../../src/assets/images/mcoin.png";
import { Skeleton } from "@mui/material";

const DailyRewardSetting = () => {
  const { dailyReward } = useSelector((state) => state.setting);
  const { dialogue, dialogueType, dialogueData, isLoading } = useSelector(
    (state) => state.dialogue
  );

  const dispatch = useDispatch();

  const [data, setData] = useState();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  useEffect(() => {
    dispatch(getDailyReward());
  }, []);

  useEffect(() => {
    setData(dailyReward);
  }, [dailyReward]);

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
            dispatch(deleteDailyReward(id));
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
      Header: "DAILY REWARD COIN",
      body: "dailyRewardCoin",
      Cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <img
            src={coin}
            alt="coin"
            style={{ width: "20px", height: "20px" }}
          />
          <span className="text-capitalize">{row?.dailyRewardCoin}</span>
        </div>
      ),
    },

    {
      Header: "DAY",
      body: "day",
      Cell: ({ row }) => <span className="text-capitalize">{row?.day}</span>,
    },

    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button className="btn btn-sm" onClick={() => handleEdit(row, "dailyReward")}>
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDeleteVideo(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="   ">
      {dialogueType == "dailyReward" && <AddDailyReward />}
      <div className=" user-table">
        <div className="user-table-top">
          <section className="d-flex justify-content-between align-items-center w-100">
            <div className="col-6">
              <h5 className="mb-0">Daily CheckIn Reward</h5>
            </div>
            <div className="col-6 d-flex justify-content-end">
              <Button
                btnIcon={<IconPlus width={18} height={18} />}
                newClass={""}
                btnName={"New"}
                onClick={() => handleOpenNew("dailyReward")}
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
                  } else if (col.Header === "DAILY REWARD COIN") {
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

export default DailyRewardSetting;
