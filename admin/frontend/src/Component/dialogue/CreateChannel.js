import { Box, Modal, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../extra/Button";
import Input from "../extra/Input";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import {
  createChannelFakeUser,
  getFakeUserName,
} from "../store/user/user.action";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
  p: "19px",
};

function CreateChannel(props) {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const [createChannel, setCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState();
  const [userSelect, setUserSelect] = useState();
  const [descriptionOfChannel, setDescriptionOfChannel] = useState();
  const [channelType, setChannelType] = useState(1); // 1 = free, 2 = paid
  const [subscriptionCost, setSubscriptionCost] = useState(10);
  const [error, setError] = useState({
    channelName: "",
    descriptionOfChannel: "",
    userSelect,
  });
  const { getFakeUserData } = useSelector((state) => state.user);
  const [fakeUserData, setFakeUserData] = useState();
  const dispatch = useDispatch();

  useEffect(() => {
    setCreateChannel(dialogue);
  }, [dialogue]);

  useEffect(() => {
    setUserSelect(dialogueData?.fullName);
  }, [dialogueData]);

  const handleCloseCreateChannel = () => {
    setCreateChannel(false);
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
    const matchingUsers = getFakeUserData.filter(
      (item) => item.fullName?.toLowerCase() === userSelect?.toLowerCase()
    );

    if (!channelName || !descriptionOfChannel) {
      let error = {};
      if (!channelName) error.channelName = "Channel Name Is Required !";
      if (!descriptionOfChannel)
        error.descriptionOfChannel = "Description Of Channel Is Required !";
      return setError({ ...error });
    } else {
      const createChannel = {
        fullName: channelName?.trim(),
        descriptionOfChannel: descriptionOfChannel?.trim(),
        channelType: Number(channelType),
        subscriptionCost: Number(channelType) === 2 ? Number(subscriptionCost) || 0 : 0,
      };
      props.createChannelFakeUser(dialogueData?._id, createChannel);
      handleCloseCreateChannel();
    }
  };

  useEffect(() => {
    const fakeUserName = getFakeUserData?.map((item) => item?.fullName);
    setFakeUserData(fakeUserName);
  }, [getFakeUserData]);

  useEffect(() => {
    dispatch(getFakeUserName());
  }, [dispatch]);

  return (
    <div>
      <Modal
        open={createChannel}
        onClose={handleCloseCreateChannel}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="create-channel-model">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Create Channel
          </Typography>
          <form>
          
            <div className="mb-2">
              <Input
                label={"Fake User Name"}
                name={"fakeUserName"}
                disabled={true}
                value={userSelect}
              />
            </div>
            <Input
              label={"Channel Name"}
              name={"channelName"}
              placeholder={"Enter Details..."}
              errorMessage={error.channelName && error.channelName}
              onChange={(e) => {
                setChannelName(e.target.value);
                if (!e.target.value) {
                  return setError({
                    ...error,
                    channelName: `Channel Name Is Required`,
                  });
                } else {
                  return setError({
                    ...error,
                    channelName: "",
                  });
                }
              }}
            />
            <div className="text-about">
              <label className="label-form">Description Of Channel</label>
              <textarea
                cols={6}
                rows={6}
                label={"Description Of Channel"}
                name={"descriptionOfChannel"}
                placeholder={"Enter Details..."}
                onChange={(e) => {
                  setDescriptionOfChannel(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      descriptionOfChannel: `Description Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      descriptionOfChannel: "",
                    });
                  }
                }}
              ></textarea>
              {error.descriptionOfChannel && (
                <p className="errorMessage">
                  {error.descriptionOfChannel && error.descriptionOfChannel}
                </p>
              )}
            </div>
            <div className="mb-2">
              <label className="label-form">Channel Type</label>
              <select
                className="form-control"
                value={channelType}
                onChange={(e) => setChannelType(Number(e.target.value))}
              >
                <option value={1}>Free</option>
                <option value={2}>Paid (subscription required)</option>
              </select>
            </div>
            {Number(channelType) === 2 && (
              <div className="mb-2">
                <Input
                  label={"Subscription Cost (coins)"}
                  name={"subscriptionCost"}
                  type={"number"}
                  value={subscriptionCost}
                  onChange={(e) => setSubscriptionCost(e.target.value)}
                />
              </div>
            )}
            <div className="mt-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseCreateChannel}
                btnName={"Close"}
                newClass={"close-model-btn"}
              />
              <Button
                onClick={handleSubmit}
                btnName={"Submit"}
                type={"button"}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "88px",
                  marginLeft: "10px",
                }}
              />
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default connect(null, {
  createChannelFakeUser,
  getFakeUserName,
})(CreateChannel);
