import { React, useEffect, useState } from "react";
import { CLOSE_NOTIFICATION_DIALOGUE } from "../store/dialogue/dialogue.type";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../extra/Button";
import Input from "../extra/Input";
import { sendNotification,sendAllNotification,particularAgencySendNotification } from ".././store/notification/notification.action";

const Notification = (props) => {
  const {dialogueNotification,dialogueNotificationType,dialogueNotificationData } = useSelector(
    (state) => state.dialogue
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [imagePath, setImagePath] = useState();
  const [image, setImage] = useState([]);
  const [error, setError] = useState({
    title: "",
    description: "",
    type: "",
  });
  useEffect(
    () => () => {
      setTitle("");
      setImagePath("");
      setDescription("");
      setType("");
      setImage([]);
      setError({
        title: "",
        description: "",
        image: "",
        type: "",
      });
    },
    [dialogueNotification]
  );

  const handleSend = () => {

    if (
      !title ||
      (dialogueNotificationType === "Notification" && !type) ||
      type === "selectType" ||
      !description
    ) {
      let error = {};
      if (!title) error.title = "Title Is Required!";
      if (dialogueNotificationType === "Notification") {
        if (!type || type === "selectType")
          error.type = "NotificationType Is Required!";
      }
      if (!description) error.description = "Description Is Required!";

      return setError({ ...error });
    } else {
      const formData = new FormData();
      formData.append("title", title);
      if (dialogueNotificationType === "Notification") {
        formData.append("notificationType", type);
      }
      formData.append("description", description);
      if(image?.length > 0){
        formData.append("image", image);
      }
      dialogueNotificationType === "Notification" && props.sendAllNotification(formData);
      dialogueNotificationType === "NotificationAgency" &&
        props.particularAgencySendNotification(formData, dialogueNotificationData._id);

    

      dialogueNotificationType === "NotificationUser" && props.sendNotification(formData, dialogueNotificationData?._id);

      handleCloseDialogue();
    }
  };

  const handleCloseDialogue = () => {
    dispatch({ type: CLOSE_NOTIFICATION_DIALOGUE });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const dispatch = useDispatch();

  const handleImage = (e) => {
    setImage(e.target.files[0]);
    setImagePath(URL.createObjectURL(e.target.files[0]));
  };
  const showImg = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div className="mainDialogue fade-in">
      <div className="Dialogue" style={{ width: "500px" }}>
        <div className="dialogueHeader">
          <div className="headerTitle fw-bold">Notification</div>
          <div
            className="closeBtn "
            onClick={() => {
              dispatch({ type: CLOSE_NOTIFICATION_DIALOGUE });
            }}
          >
            <i className="fa-solid fa-xmark ms-2"></i>
          </div>
        </div>
        <div
          className="dialogueMain bg-white mx-4"
          style={{ overflow: "auto" }}
        >
          <div className="">
            <div>
              <Input
                label={`Title`}
                id={`name`}
                type={`text`}
                value={title}
                errorMessage={error.title && error.title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      title: `Title Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      title: "",
                    });
                  }
                }}
              />
            </div>
            <div>
              <Input
                label={`Description`}
                id={`name`}
                type={`text`}
                value={description}
                errorMessage={error.description && error.description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      description: `Description Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      description: "",
                    });
                  }
                }}
              />
            </div>
            {dialogueNotificationType === "Notification" && (
              <div className="form-group">
                <h6 className="fs-6">Notification Type</h6>
                <select
                  className=" form-input px-2 py-2"
                  aria-label="Default select example"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value === "selectType") {
                      return setError({
                        ...error,
                        type: "Please select Type!",
                      });
                    } else {
                      return setError({
                        ...error,
                        type: "",
                      });
                    }
                  }}
                >
                  <option value="selectType">Select Type</option>
                  <option value="agency">District Franchise</option>
                  <option value="host">Host</option>
                  <option value="user">User</option>
                </select>
                {error.type && (
                  <div className="ml-2 mt-1">
                    {error.type && (
                      <p className="text-error">{error.type}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="mt-2">
              <Input
                label={`Image (Optional)`}
                id={`image`}
                type={`file`}
                onChange={(e) => handleImage(e)}
              />
              {imagePath && (
                <div className="image-start">
                  <img
                    src={imagePath}
                    alt="banner"
                    draggable="false"
                    width={80}
                    height={80}
                    className="m-0 cursor rounded p-1"
                    onClick={() => showImg(imagePath)}
                    style={{
                      boxShadow: " 0px 5px 10px 0px rgba(0, 0, 0, 0.5)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="dialogueFooter">
            <div className="dialogueBtn">
              <Button
                btnName={`Submit`}
                btnColor={`btnBlackPrime text-white`}
                style={{ borderRadius: "5px", width: "80px" }}
                newClass={`me-2`}
                onClick={handleSend}
              />
              <Button
                btnName={`Close`}
                btnColor={`bg-danger text-white`}
                style={{ borderRadius: "5px", width: "80px" }}
                onClick={handleCloseDialogue}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(null, { sendNotification,sendAllNotification,particularAgencySendNotification })(Notification);
