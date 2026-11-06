import React, { forwardRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { Box, Divider, IconButton, Slide } from "@mui/material";
import {
  IconLock,
  IconX,
  IconMessage,
  IconExternalLink,
} from "@tabler/icons-react";
import Button from "../extra/Button";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PaymentRestrictionsDialog = ({ open, onClose }) => {
  const handleClose = () => onClose?.();

  return (
    <Dialog
      className="payment-restriction-dialog"
      open={Boolean(open)}
      onClose={handleClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby="payment-restrictions-dialog-title"
      fullWidth
      maxWidth="sm"
      scroll="body"
      PaperProps={{
        elevation: 0,
        className: "payment-restriction-dialog__paper",
        sx: { overflow: "visible", position: "relative" },
      }}
    >
      <IconButton
        aria-label="Close dialog"
        onClick={handleClose}
        className="payment-restriction-dialog__close"
        size="small"
      >
        <IconX size={20} stroke={1.75} />
      </IconButton>

      <DialogContent className="payment-restriction-dialog__body">
        <Box className="payment-restriction-dialog__icon">
          <IconLock size={28} stroke={1.5} />
        </Box>

        <Typography
          component="h2"
          variant="h5"
          id="payment-restrictions-dialog-title"
          className="payment-restriction-dialog__heading"
        >
          Extended License Required
        </Typography>

        <Typography
          variant="body1"
          className="payment-restriction-dialog__text"
        >
          If you want to charge end users by any way, you are required to
          purchase an Extended License as per CodeCanyon/Envato policy.
        </Typography>

        <Divider className="payment-restriction-dialog__divider" />

        <Typography
          variant="body1"
          className="payment-restriction-dialog__sub"
        >
          Contact us to upgrade license
        </Typography>

        <Box className="payment-restriction-dialog__actions">
          <Button
            type="button"
            btnName="+91 9909515320"
            newClass="submit-btn"
            onClick={() => window.open("https://wa.me/+919909515320", "_blank")}
            btnIcon={<IconMessage size={20} stroke={1.75} />}
          />

          <Box
            component="a"
            href="https://codecanyon.net/licenses/faq#main-differences-licenses-a"
            target="_blank"
            rel="noopener noreferrer"
            className="payment-restriction-dialog__link"
          >
            View Envato License Policy
            <IconExternalLink size={18} stroke={1.75} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRestrictionsDialog;
