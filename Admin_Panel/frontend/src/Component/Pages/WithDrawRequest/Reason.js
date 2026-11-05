import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import { acceptOrDeclineRequest } from "../../store/monetization/monetization.action";
import { useDispatch, useSelector } from "react-redux";
import styled from "@emotion/styled";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";
import Input from "../../extra/Input";
import { declineRequest } from "../../store/withdraw/withdraw.action";
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

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));
const Reason = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [contactUsDialogue, setContectUsDialogue] = useState(false);

  const [error, setError] = useState({
    reason: "",
  });
  useEffect(() => {
    setContectUsDialogue(dialogue);
  }, [dialogue]);

  const handleSubmit = () => {
    
    if (!reason) {
      let error = {};
      if (!reason)  error.reason = "Reason is Required.";

      return setError({ ...error });
    } else {
      dispatch(declineRequest(dialogueData?._id,reason));
      handleCloseAddCategory()
    }
  };
  const handleCloseAddCategory = () => {
    setContectUsDialogue(false);
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

  return (
    <div>
      <Modal
        open={contactUsDialogue}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="model-style">
          <div className="model-header">
            <p className="m-0">
              Reason Dialogue
            </p>
          </div>
        <div className="model-body">
          <form>
            <Input
              label={"Reason"}
              name={"reason"}
              placeholder={"Enter Reason..."}
              value={reason}
              errorMessage={error?.reason && error?.reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (!e.target.value) {
                  return setError({
                    ...error,
                    reason: `Reason  Is Required`,
                  });
                } else {
                  return setError({
                    ...error,
                    reason: "",
                  });
                }
              }}
            />
            
          </form>
        </div>
        <div className="model-footer">
          <div className=" d-flex justify-content-end m-3">
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

export default Reason;
