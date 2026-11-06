import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import { acceptOrDeclineRequest } from "../../store/monetization/monetization.action";
import { useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";


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

const AcceptedRequestDialog = () => {

  const { dialogue, dialogueData } = useSelector((state) => state.dialogue);
  const dispatch = useDispatch();
  const [contactUsDialogue, setContectUsDialogue] = useState(false);

  useEffect(() => {
    setContectUsDialogue(dialogue);
  }, [dialogue]);

  const handleSubmit = () => {

    dispatch(acceptOrDeclineRequest(dialogueData?._id, 2));
    handleCloseAddCategory();
  };

  const handleCloseAddCategory = () => {
    setContectUsDialogue(false);
    dispatch({
      type: CLOSE_DIALOGUE,
      payload: {
        dialogue: false,
      },
    });
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
          <div className="model-body">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Would you like to approve the monetization request?
            </Typography>
          </div>
          <div className="model-footer">
            <div className="d-flex justify-content-end m-3">
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

export default AcceptedRequestDialog;
