import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const setToast = (arg1, arg2) => {
  let type = "info";
  let message = "";

  const validTypes = ["success", "error", "warning", "info"];

  if (validTypes.includes(arg1)) {
    type = arg1;
    message = typeof arg2 === "string" ? arg2 : JSON.stringify(arg2 || "Notification");
  } else if (validTypes.includes(arg2)) {
    type = arg2;
    message = typeof arg1 === "string" ? arg1 : JSON.stringify(arg1 || "Notification");
  } else {
    message = typeof arg1 === "string" ? arg1 : typeof arg2 === "string" ? arg2 : "Notification";
  }

  return toast(message, {
    type: type,
    position: "top-right",
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};
