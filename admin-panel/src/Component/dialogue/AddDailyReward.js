import { Box, Modal } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../extra/Button";
import Input from "../extra/Input";
import Selector from "../extra/Selector";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import {
  addDailyReward,
  updateDailyReward
} from "../store/setting/setting.action";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
  p: "19px",
};
const AddDailyReward = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [addCategory, setAddCategory] = useState(false);
  const [dailyRewardCoin, setDailyRewardCoin] = useState();
  const [day, setDay] = useState();

  const [error, setError] = useState({
    dailyRewardCoin: "",
    day: "",
  });

  const dispatch = useDispatch();
  useEffect(() => {
    setAddCategory(dialogue);
    if (dialogueData) {
      setDailyRewardCoin(dialogueData?.dailyRewardCoin);
      setDay(dialogueData?.day);
    }
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategory(false);
    dispatch({
      type: CLOSE_DIALOGUE,
      payload: {
        dialogue: false,
      },
    });

    let dialogueData_ = {
      dialogue: false,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };

  const handleSubmit = () => {

    if (!dailyRewardCoin || !day) {
      let error = {};
      if (!dailyRewardCoin)
        error.dailyRewardCoin = "Daily Reward Coin Is Required !";

      if (!day) error.day = "Day is required !";

      return setError({ ...error });
    } else {
      const addWithdrawItem = {
        dailyRewardCoin: dailyRewardCoin,
        day: day,
      };
      if (dialogueData) {
        let payload = {
          dailyRewardCoinId: dialogueData?._id,
          dailyRewardCoin: dailyRewardCoin,
          day: day,
        };
        dispatch(updateDailyReward(payload, dialogueData?._id));
      } else {
        dispatch(addDailyReward(addWithdrawItem));
      }
      handleCloseAddCategory();
    }
  };
  return (
    <div>
      <Modal
        open={addCategory}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="model-style">
          <div className="model-header">
            <p className="m-0">
              {dialogueData
                ? "Update Daily Reward"
                : "Create Daily Reward"}
            </p>
          </div>
          <div className="model-body">
            <form className="">
              <Selector
                label={"Day"}
                name={"day"}
                placeholder={"Select Day..."}
                selectValue={day}
                type={"number"}
                selectData={["1", "2", "3", "4", "5", "6", "7"]}
                errorMessage={error.day && error.day}
                disabled={dialogueData ? true : false}
                onChange={(e) => {
                  setDay(parseInt(e.target.value));
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      day: `Day Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      day: "",
                    });
                  }
                }}
              />

              <div className="mt-3">
                <Input
                  label={"Daily Reward Coin"}
                  name={"dailyRewardCoin"}
                  placeholder={"Enter Daily Reward Coin..."}
                  value={dailyRewardCoin}
                  type={"number"}
                  errorMessage={error.dailyRewardCoin && error.dailyRewardCoin}
                  onChange={(e) => {
                    setDailyRewardCoin(parseInt(e.target.value));
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        dailyRewardCoin: `Daily Reward Coin Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        dailyRewardCoin: "",
                      });
                    }
                  }}
                />
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAddCategory}
                btnName={"Close"}
                newClass={"close-model-btn me-2"}
              />
              <Button
                onClick={handleSubmit}
                btnName={"Submit"}
                type={"button"}
                newClass={"submit-btn"}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default AddDailyReward;
