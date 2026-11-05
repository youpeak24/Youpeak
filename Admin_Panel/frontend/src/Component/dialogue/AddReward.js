import { Box, Modal, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Selector from "../extra/Selector";
import Input from "../extra/Input";
import Button from "../extra/Button";
import { addAdsReward, updateReward } from "../store/setting/setting.action";
import { connect, useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";


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
const AddReward = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [addCategory, setAddCategory] = useState(false);
  const [adLabel, setAdlabel] = useState();
  const [adDisplayInterval, setAdDisplayInterval] = useState();
  const [coinEarnedFromAd, setCoinEarnedFromAd] = useState();
  const [error, setError] = useState({
    adLabel: "",
    adDisplayInterval: "",
    coinEarnedFromAd: "",
  });

  const dispatch = useDispatch();
  useEffect(() => {
    setAddCategory(dialogue);
    if (dialogueData) {
      setAdlabel(dialogueData?.adLabel);
      setAdDisplayInterval(dialogueData?.adDisplayInterval);
      setCoinEarnedFromAd(dialogueData?.coinEarnedFromAd);
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

    if (!adLabel || !adDisplayInterval || !coinEarnedFromAd) {
      let error = {};
      if (!adLabel) error.adLabel = "Name Is Required !";
      if (!adDisplayInterval)
        error.adDisplayInterval = "adDisplayInterval Is Required !";
      if (!coinEarnedFromAd)
        error.coinEarnedFromAd = "coinEarnedFromAd Is Required !";
      return setError({ ...error });
    } else {
      const addWithdrawItem = {
        adLabel: adLabel,
        adDisplayInterval: adDisplayInterval,
        coinEarnedFromAd: coinEarnedFromAd,
      };
      if (dialogueData) {
        let payload = {
          adRewardId: dialogueData?._id,
          adLabel: adLabel,
          adDisplayInterval: adDisplayInterval,
          coinEarnedFromAd: coinEarnedFromAd,
        };
        dispatch(updateReward(payload, dialogueData?._id));
      } else {
        dispatch(addAdsReward(addWithdrawItem));
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
                ? "Update Ads Coin Rewards"
                : "Create Ads Coin Rewards"}
            </p>
          </div>
          <div className="model-body">
            <form>
              <Input
                label={"Name"}
                name={"adLabel"}
                placeholder={"Enter label..."}
                value={adLabel}
                errorMessage={error.adLabel && error.adLabel}
                onChange={(e) => {
                  setAdlabel(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      adLabel: `Name Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      adLabel: "",
                    });
                  }
                }}
              />
              <div className="mt-2">
                <Input
                  label={"Coin"}
                  name={"coinEarnedFromAd"}
                  placeholder={"Enter Coin..."}
                  value={coinEarnedFromAd}
                  type={"number"}
                  errorMessage={error.coinEarnedFromAd && error.coinEarnedFromAd}
                  onChange={(e) => {
                    setCoinEarnedFromAd(parseInt(e.target.value));
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        coinEarnedFromAd: `Coin Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        coinEarnedFromAd: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="mt-2 add-adDisplayIntervals">
                <Input
                  label={"Ad Interval (seconds)"}
                  adLabel={"adDisplayInterval"}
                  placeholder={"Enter adDisplayIntervals..."}
                  value={adDisplayInterval}
                  type={"number"}
                  onChange={(e) => {
                    setAdDisplayInterval(parseInt(e.target.value));
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        adDisplayInterval: `adDisplayIntervals Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        adDisplayInterval: "",
                      });
                    }
                  }}
                />
              </div>
              <div>
                {error?.adDisplayInterval && (
                  <p className="errorMessage">{error?.adDisplayInterval}</p>
                )}
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

export default AddReward;
