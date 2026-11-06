import { Box, Modal } from "@mui/material";
import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../extra/Button";
import Input from "../extra/Input";
import { addCoinPlan, updateCoinPlan } from "../store/coinPlan/coinPlan.action";
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

function CreatePlan(props) {
  const { dialogue, dialogueData } = useSelector((state) => state.dialogue);
  const [coin, setCoin] = useState("");
  const [extraCoin, setExtraCoin] = useState("");
  const [premiumPlan, setPremiumPlan] = useState(false);
  const [amount, setAmount] = useState("");
  // const [image, setImage] = useState();
  // const [imgApi, setImgApi] = useState();

  const [productKey, setProductKey] = useState();
  const [error, setError] = useState({
    extraCoin: "",
    coin: "",
    // image: "",
    amount: "",
    productKey: "",
  });
  const dispatch = useDispatch();
  useEffect(() => {
    setPremiumPlan(dialogue);
  }, [dialogue]);


  let folderStructure = "coinplanImage";
  // const handleFileUpload = async (event) => {
  //     
  //     const { resDataUrl, imageURL } = await uploadFile(
  //         event.target.files[0],
  //         folderStructure
  //     );
  //     setImgApi(resDataUrl);
  //     // if (imageURL) {
  //     //     setImage(imageURL);
  //     // }

  //     if (!event.target.files[0]) {
  //         return setError({
  //             ...error,
  //             image: `Image Is Required`,
  //         });
  //     } else {
  //         return setError({
  //             ...error,
  //             image: "",
  //         });
  //     }
  // };

  useEffect(() => {
    if (dialogueData) {
      setAmount(dialogueData?.amount);
      setCoin(dialogueData?.coin);
      setExtraCoin(dialogueData?.extraCoin);
      setAmount(dialogueData?.amount);
      setProductKey(dialogueData?.productKey);
      // setImage(dialogueData?.icon);
      // setImgApi(dialogueData?.icon);
    }
  }, [dialogueData]);

  const handleCloseCreateChannel = () => {
    setPremiumPlan(false);
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

    if (!amount || !coin || !productKey || !extraCoin) {
      let error = {};
      if (!coin) error.coin = "Coin Is Required !";
      if (!amount) error.amount = "Amount Is Required !";
      if (!image) error.image = "Image Is Required !";
      if (!extraCoin) error.extraCoin = "ExtraCoin Is Required !";
      if (!productKey) error.productKey = "productKey Is Required !";
      // if (!imgApi) error.imgApi = "image Is Required !";
      return setError({ ...error });
    } else {
      const planBenefitData = {
        coin: coin,
        amount: amount,
        extraCoin: extraCoin,
        // icon: imgApi,
        productKey: productKey,
      };
      if (dialogueData) {
        props.updateCoinPlan(planBenefitData, dialogueData?._id);
      } else {
        props.addCoinPlan(planBenefitData);
      }
      handleCloseCreateChannel();
    }
  };

  return (
    <div>
      <Modal
        open={premiumPlan}
        onClose={handleCloseCreateChannel}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="model-style">
          <div className="model-header">
            <p className="m-0">Add Coin Plan</p>
          </div>
          <div className="model-body">
            <form>
              <div className="row">
                <div className="col-12 col-sm-6 col-md-6 col-lg-12 mt-2">
                  <Input
                    label={"Coin"}
                    name={"coin"}
                    type={"number"}
                    placeholder={"Enter Coin"}
                    errorMessage={error.coin && error.coin}
                    value={coin}
                    onChange={(e) => {
                      setCoin(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          coin: `Coin Key Is Required !`,
                        });
                      } else {
                        return setError({
                          ...error,
                          coin: "",
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-sm-6 col-md-6 col-lg-12 mt-2">
                  <Input
                    label={"Extra Coin"}
                    name={"extraCoin"}
                    type={"number"}
                    placeholder={"Enter Extra Coin"}
                    value={extraCoin}
                    errorMessage={error.extraCoin && error.extraCoin}
                    onChange={(e) => {
                      setExtraCoin(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          extraCoin: `extraCoin Key Is Required !`,
                        });
                      } else {
                        return setError({
                          ...error,
                          extraCoin: "",
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-sm-6 col-md-6 col-lg-12 mt-2">
                  <Input
                    label={"Amount"}
                    name={"amount"}
                    type={"number"}
                    placeholder={"Enter Amount"}
                    errorMessage={error.amount && error.amount}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          amount: `Amount Key Is Required !`,
                        });
                      } else {
                        return setError({
                          ...error,
                          amount: "",
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-sm-6 col-md-6 col-lg-12 mt-2">
                  <Input
                    label={"Product Key"}
                    name={"productKey"}
                    value={productKey}
                    placeholder={"Product Key"}
                    errorMessage={error.productKey && error.productKey}
                    onChange={(e) => {
                      setProductKey(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          productKey: `Product Key Is Required !`,
                        });
                      } else {
                        return setError({
                          ...error,
                          productKey: "",
                        });
                      }
                    }}
                  />
                </div>
              </div>
              {/* <div className="mt-2 ">
                                <Input
                                    type={"file"}
                                    label={"Image"}
                                    accept={"image/png, image/jpeg"}
                                    errorMessage={error.image && error.image}
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <div className=" mt-2 fake-create-img mb-2">
                                {image && <img src={image} style={{ width: "96px", height: "auto" }} />}
                            </div> */}
            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseCreateChannel}
                btnName={"Close"}
                newClass={"close-model-btn me-3"}
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
}
export default connect(null, {
  addCoinPlan,
  updateCoinPlan,
})(CreatePlan);
