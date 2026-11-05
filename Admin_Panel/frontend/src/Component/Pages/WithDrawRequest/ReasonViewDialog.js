import { Box, Modal } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { IconX } from "@tabler/icons-react";

const ReasonViewDialog = () => {
  const { dialogue, dialogueData } = useSelector((state) => state.dialogue);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(dialogue);
  }, [dialogue]);

  const handleClose = () => {
    setOpen(false);
    dispatch({
      type: CLOSE_DIALOGUE,
      payload: { dialogue: false },
    });
    sessionStorage.setItem(
      "dialogueData",
      JSON.stringify({ dialogue: false })
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="reason-view-modal"
      aria-describedby="reason-view-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxWidth: "90vw",
          bgcolor: "background.paper",
          borderRadius: "13px",
          border: "1px solid #C9C9C9",
          boxShadow: 24,
          overflow: "hidden",
        }}
        className="model-style"
      >
        <div className="model-header d-flex justify-content-between align-items-center">
          <p className="m-0">Reason</p>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-link p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
            style={{ minWidth: 32, minHeight: 32 }}
            aria-label="Close"
          >
            <IconX size={22} className="text-secondary" />
          </button>
        </div>
        <div className="model-body p-3">
          
          <div
            className="p-3 rounded-md border bg-light"
            style={{ minHeight: 80, maxHeight: 280, overflowY: "auto" }}
          >
            <p className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>
              {dialogueData?.reason || "—"}
            </p>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default ReasonViewDialog;
