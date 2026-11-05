import { Box, Modal } from "@mui/material";
import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../extra/Button";
import Input from "../extra/Input";
import Selector from "../extra/Selector";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import {
  addPremiumPlan,
  updatePremiumPlan,
} from "../store/premiumPlan/premiumPlan.action";


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

function CreatePremiumPlan(props) {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const [premiumPlan, setPremiumPlan] = useState(false);
  const [planBenefit, setPlanBenefit] = useState();
  const [validity, setValidity] = useState();
  const [validityType, setValidityType] = useState();
  const [amount, setAmount] = useState();
  const [productKey, setProductKey] = useState();
  const [premiumPlanArray, setPremiumPlanArray] = useState([]);
  const [error, setError] = useState({
    planBenefit: "",
    validity: "",
    validityType: "",
    amount: "",
    productKey: "",
  });
  const dispatch = useDispatch();

  useEffect(() => {
    setPremiumPlan(dialogue);
  }, [dialogue]);

  useEffect(() => {
    if (dialogueData) {
      setPlanBenefit(dialogueData?.planBenefit);
      setValidity(dialogueData?.validity);
      setValidityType(dialogueData?.validityType);
      setAmount(dialogueData?.amount);
      setProductKey(dialogueData?.productKey);
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

  const updateHashTagArray = (planBenefitData) => {
    const planBenefitArray = planBenefitData
      ?.split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    setPremiumPlanArray(planBenefitArray);
  };

  useState(() => {
    updateHashTagArray(planBenefit);
  }, []);

  const handlePlanBenefitChange = (event) => {
    const newBenefit = event.target.value;
    setPlanBenefit(newBenefit);
    updateHashTagArray(newBenefit);
    if (!event.target.value) {
      return setError({
        ...error,
        planBenefit: `Plan Benefit Is Required !`,
      });
    } else {
      return setError({
        ...error,
        planBenefit: "",
      });
    }
  };

  const handleSubmit = () => {

    const amountValue = parseInt(amount);
    const validityValue = parseInt(validity);
    if (
      !amount ||
      !planBenefit ||
      !validity ||
      !validityType ||
      !productKey ||
      amountValue <= 0 ||
      validityValue <= 0
    ) {
      let error = {};
      if (!planBenefit) error.planBenefit = "Plan Benefit Is Required !";
      if (!amount) error.amount = "Amount Is Required !";
      if (!validity) error.validity = "Validity Is Required !";
      if (!validityType) error.validityType = "Validity Type Is Required !";
      if (amountValue <= 0) error.amount = "Amount Invalid !";
      if (!productKey) error.productKey = "ProductKey Invalid !";
      if (validityValue <= 0) error.validity = "Validity Invalid !";
      return setError({ ...error });
    } else {
      const planBenefitData = {
        planBenefit: planBenefit,
        amount: parseInt(amount),
        validity: parseInt(validity),
        validityType: validityType,
        productKey: productKey,
      };
      if (dialogueData) {
        props.updatePremiumPlan(planBenefitData, dialogueData?._id);
      } else {
        props.addPremiumPlan(planBenefitData);
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
            <p className="m-0">{dialogueData ? "Edit Plan" : "Add Plan"}</p>
          </div>
          <div className="model-body">
            <form>
              <div className="row mb-2">
                <div className="col-12 col-sm-6 col-md-6 col-lg-6">
                  <Input
                    label={"Validity"}
                    name={"validity"}
                    type={"number"}
                    placeholder={"Validity"}
                    value={validity}
                    errorMessage={error.validity && error.validity}
                    onChange={(e) => {
                      setValidity(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          validity: `Validity Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          validity: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-6 col-lg-6">
                  <Selector
                    label={"Validity Type"}
                    selectValue={validityType}
                    placeholder={"Select Validity Type"}
                    selectData={["month", "year"]}
                    errorMessage={error.validityType && error.validityType}
                    onChange={(e) => {
                      setValidityType(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          validityType: `Validity Type Is Required !`,
                        });
                      } else {
                        return setError({
                          ...error,
                          validityType: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Amount"}
                    name={"amount"}
                    value={amount}
                    placeholder={"Amount"}
                    type={"number"}
                    errorMessage={error.amount && error.amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          amount: `Amount Is Required !`,
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
                <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Product Key"}
                    name={"productKey"}
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
              <div className="custom-input">
                <label className="">Plan Benefit</label>
                <textarea
                  cols={6}
                  rows={6}
                  className="form-control"
                  label={"planBenefit"}
                  name={"planBenefit"}
                  value={planBenefit}
                  placeholder={"Plan Benefit"}
                  onChange={handlePlanBenefitChange}
                ></textarea>
                <span className="text-danger d-flex mt-1">
                  Note :You can add Plan Benefit separate by comma (,)
                </span>
                {error.planBenefit && (
                  <p className="errorMessage">
                    {error.planBenefit && error.planBenefit}
                  </p>
                )}
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseCreateChannel}
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
}
export default connect(null, {
  addPremiumPlan,
  updatePremiumPlan,
})(CreatePremiumPlan);
