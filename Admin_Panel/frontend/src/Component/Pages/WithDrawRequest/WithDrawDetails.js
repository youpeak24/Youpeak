import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";
import styled from "@emotion/styled";
import {
  acceptRequest,
  declineRequest,
} from "../../store/withdraw/withdraw.action";


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

const WithDrawDetails = () => {
  const { dialogue, dialogueData } = useSelector((state) => state.dialogue);



  const dispatch = useDispatch();
  const [contactUsDialogue, setContactUsDialogue] = useState(false);

  const detailsArray = dialogueData?.paymentDetails?.map((data) => data);

  useEffect(() => {
    setContactUsDialogue(dialogue);
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {


    setContactUsDialogue(false);
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

    dispatch(acceptRequest(dialogueData?._id));
    handleCloseAddCategory();
  };

  return (
    <div>
      <Modal
        open={contactUsDialogue}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="create-channel-model">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Withdrawal Details
          </Typography>
          <form>
            <Input
              label={"Name"}
              name={"name"}
              placeholder={"Enter Name"}
              disabled={true}
              value={dialogueData?.userId?.fullName}
            />
            <Input
              label={"Transaction ID"}
              name={"transactionId"}
              value={dialogueData?.uniqueId || "—"}
              newClass={"mt-3"}
              readOnly
            />
            <Input
              label={"Payment Gateway"}
              name={"paymentGateway"}
              placeholder={"Enter Symbol"}
              value={dialogueData?.paymentGateway}
              newClass={`mt-3`}
            />
            {dialogueData?.paymentDetails?.map((data) => {
              return (
                <>
                  <Input
                    label={`${data.split(":")[0]}`}
                    name={"bankName"}
                    placeholder={"Enter Symbol"}
                    value={data.split(":")[1]}
                    newClass={`mt-3`}
                    readOnly
                  />
                </>
              );
            })}

            <Input
              label={"Request Date"}
              name={"detailsArray"}
              placeholder={"Enter Symbol"}
              value={dialogueData?.requestDate}
              newClass={`mt-3`}
            />

            <div className="mt-3 d-flex justify-content-end gap-3">
              <Button
                onClick={handleCloseAddCategory}
                btnName={"Close"}
                newClass={"close-model-btn"}
                style={{ backgroundColor: "red" }}
              />
              <Button
                onClick={handleSubmit}
                btnName={"Accept"}
                type={"button"}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "80px",
                  marginLeft: "10px",
                }}
              />
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default WithDrawDetails;
