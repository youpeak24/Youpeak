import React, { useEffect, useState } from "react";
import Input from "../../extra/Input";
import NewTitle from "../../extra/Title";
import {
  getSettingApi,
  getWithdrawalApi,
  isActivePaymentGetWay,
  editSetting,
  deleteWithdrawalApi,
} from "../../store/setting/setting.action";
import Button from "../../extra/Button";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import AddIcon from "@mui/icons-material/Add";
import { connect, useDispatch, useSelector } from "react-redux";
import Pagination from "../../extra/Pagination";
import noImageFound from "../../../assets/images/noimage.png";
import $ from "jquery";
import Table from "../../extra/Table";
import dayjs from "dayjs";
import WithdrawItemAdd from "../../dialogue/WithdrawItemAdd";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { FormControlLabel, Switch } from "@mui/material";
import styled from "@emotion/styled";
import { warning } from "../../../util/Alert";
import { setToast } from "../../../util/toast";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Skeleton } from "@mui/material";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: "76px",
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    top: "8px",
    transform: "translateX(10px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(38px)",
      top: "8px",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.5992 5.06724L16.5992 5.06719C16.396 4.86409 16.1205 4.75 15.8332 4.75C15.546 4.75 15.2705 4.86409 15.0673 5.06719L15.0673 5.06721L7.91657 12.2179L4.93394 9.23531C4.83434 9.13262 4.71537 9.05067 4.58391 8.9942C4.45174 8.93742 4.30959 8.90754 4.16575 8.90629C4.0219 8.90504 3.87925 8.93245 3.74611 8.98692C3.61297 9.04139 3.49202 9.12183 3.3903 9.22355C3.28858 9.32527 3.20814 9.44622 3.15367 9.57936C3.0992 9.7125 3.07179 9.85515 3.07304 9.99899C3.07429 10.1428 3.10417 10.285 3.16095 10.4172C3.21742 10.5486 3.29937 10.6676 3.40205 10.7672L7.15063 14.5158L7.15066 14.5158C7.35381 14.7189 7.62931 14.833 7.91657 14.833C8.20383 14.833 8.47933 14.7189 8.68249 14.5158L8.68251 14.5158L16.5992 6.5991L16.5992 6.59907C16.8023 6.39592 16.9164 6.12042 16.9164 5.83316C16.9164 5.54589 16.8023 5.27039 16.5992 5.06724Z" fill="white" stroke="white" stroke-width="0.5"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette === "dark" ? "#0FB515" : "red",
    width: 24,
    height: 24,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.1665 5.83301L5.83325 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M5.83325 5.83301L14.1665 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: "52px",
    border: "0.5px solid rgba(0, 0, 0, 0.14)",
    background: " #eff6ff",
    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.08) inset",
    opacity: 1,
    width: "60px",
    height: "28px",
    borderRadius: "52px",
  },
}));

function PaymentGatewaySetting(props) {
  const { withdrawData, settingData } = useSelector((state) => state.setting);

  const { dialogue, dialogueType, dialogueData, isLoading } = useSelector(
    (state) => state.dialogue
  );

  const dispatch = useDispatch();
  const [data, setData] = useState();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [showImg, setShowImg] = useState();
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [minWithdrawalRequestedAmount, setMinWithdrawalRequestedAmount] =
    useState();
  const [originalData, setOriginalData] = useState({});

  const [error, setError] = useState({
    minWithdrawalRequestedAmount: "",
  });

  useEffect(() => {
    dispatch(getWithdrawalApi());
    dispatch(getSettingApi());
  }, [dispatch]);

  useEffect(() => {
    setMinWithdrawalRequestedAmount(settingData?.minWithdrawalRequestedAmount);
    setOriginalData({
      minWithdrawalRequestedAmount: settingData?.minWithdrawalRequestedAmount,
    });
  }, [settingData]);

  $(document).ready(function () {
    $("img").bind("error", function () {
      // Set the default image
      $(this).attr("src", noImageFound);
    });
  });

  useEffect(() => {
    setData(withdrawData);
  }, [withdrawData]);

  const handleEdit = (row, type) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: {
        type: type,
        data: row,
      },
    });

    let dialogueData_ = {
      dialogue: true,
      type: type,
      dialogueData: row,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };

  const withdrawTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }) => <span>{(page - 1) * size + index + 1}</span>,
    },
    {
      Header: "NAME",
      body: "name",
      Cell: ({ row }) => <span className="text-capitalize">{row?.name}</span>,
    },
    {
      Header: "IMAGE",
      body: "image",
      Cell: ({ row, index }) =>
        showImg ? (
          <img
            src={showImg[index]}
            width="96px"
            height="auto"
            style={{ objectFit: "cover" }}
          />
        ) : (
          ""
        ),
    },
    {
      Header: "DETAILS",
      body: "details",
      Cell: ({ row }) => (
        <span className="text-capitalize text-start">
          <ul>
            {row?.details?.map((detail, index) => (
              <li>{detail}</li>
            ))}
          </ul>
        </span>
      ),
    },
    {
      Header: "CREATE DATE",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("MM/DD/YYYY hh:mm A") : ""}
        </span>
      ),
    },
    {
      Header: "ENABLED",
      body: "isEnabled",
      Cell: ({ row }) => (
        <div className="d-flex justify-content-center align-items-center gap-2 w-100 payment-withdraw-switch-row">

          <FormControlLabel
            className="m-0 flex-shrink-0"
            control={
              <MaterialUISwitch
                sx={{ m: 0.5 }}
                checked={Boolean(row?.isEnabled)}
                onChange={() => handleIsActive(row)}
              />
            }
          />
        </div>
      ),
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button className="btn btn-sm" onClick={() => handleEdit(row, "withdrawItem")}>
            <IconEdit className="text-secondary" size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => handleDeleteVideo(row)}>
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [data]);

  const fetchData = () => {
    if (!data || data.length === 0) return;

    const urls = data.map((item) => {
      return item?.image ? item.image : noImageFound;
    });

    setShowImg(urls);
  };
  const handleOpenNew = (type) => {
    dispatch({
      type: OPEN_DIALOGUE,
      payload: {
        type: type,
      },
    });

    let dialogueData_ = {
      dialogue: true,
      type: type,
    };
    sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
  };
  const handleSelectCheckData = (e, row) => {
    const checked = e.target.checked;

    if (checked) {
      setSelectCheckData((prevSelectedRows) => [...prevSelectedRows, row]);
    } else {
      setSelectCheckData((prevSelectedRows) =>
        prevSelectedRows.filter((selectedRow) => selectedRow._id !== row._id)
      );
    }
  };
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    if (checked) {
      setSelectCheckData([...data]);
    } else {
      setSelectCheckData([]);
    }
  };

  useEffect(() => {
    const currentRows = Array.isArray(data) ? data : [];
    const allSelected =
      currentRows.length > 0 &&
      currentRows.every((row) =>
        selectCheckData.some((selected) => selected?._id === row?._id)
      );

    if (selectAllChecked !== allSelected) {
      setSelectAllChecked(allSelected);
    }
  }, [data, selectCheckData, selectAllChecked]);

  const handleDeleteVideo = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed;
          if (yes) {
            const id = row?._id;
            dispatch(deleteWithdrawalApi(id));
          }
        }
      })
      .catch((err) => console.log(err));
  };

  const paginationSubmitButton = () => {
    const selectCheckDataGetId = selectCheckData?.map((item) => item?._id);
  };

  const handleIsActive = (row) => {

    const id = row?._id;
    const data = row?.isEnabled === false ? true : false;
    props.isActivePaymentGetWay(id, data);
  };

  const handleSubmit = () => {

    const minWithdrawalRequestedAmountValue = parseInt(
      minWithdrawalRequestedAmount
    );

    if (
      minWithdrawalRequestedAmount === "" ||
      minWithdrawalRequestedAmountValue <= 0
    ) {
      let error = {};

      if (minWithdrawalRequestedAmount === "")
        error.minWithdrawalRequestedAmount = "Amount Is Required !";

      if (minWithdrawalRequestedAmountValue <= 0)
        error.minWithdrawalRequestedAmount = "Amount Invalid !";

      return setError({ ...error });
    } else {
      // Only send changed fields
      const updatedData = {};
      if (parseInt(minWithdrawalRequestedAmount) !== originalData.minWithdrawalRequestedAmount) {
        updatedData.minWithdrawalRequestedAmount = parseInt(minWithdrawalRequestedAmount);
      }

      // If there are changes, send payload with only updated fields
      if (Object.keys(updatedData).length > 0) {
        props.editSetting(settingData?._id, updatedData);
      } else {
        setToast("info", "No changes made");
      }
    }
  };

  useEffect(() => {
    if (props.submitTrigger > 0) {
      handleSubmit();
    }
  }, [props.submitTrigger]);

  return (
    <div className="payment-setting p-0 mainSetting">
      {dialogueType == "withdrawItem" && <WithdrawItemAdd />}
      <div className="settingBox row g-3 mb-3">
        <div className="col-12 ">
          <div className="settingBoxOuter withdrawal-limit-card">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center flex-wrap gap-2 px-2">
              <h4 className="settingboxheader mb-0">Minimum Withdrawal Limit</h4>
            </div>

            <div className="setting-box-body withdrawal-limit-body">
              <div className="withdrawal-input">
                <Input
                  label={"Minimum Withdrawal Request Amount"}
                  name={"minWithdrawalRequestedAmount"}
                  type={"number"}
                  loading={isLoading}
                  value={minWithdrawalRequestedAmount}
                  errorMessage={
                    error.minWithdrawalRequestedAmount &&
                    error.minWithdrawalRequestedAmount
                  }
                  placeholder={"Enter Amount"}
                  onChange={(e) => {
                    setMinWithdrawalRequestedAmount(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        minWithdrawalRequestedAmount: `Amount Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        minWithdrawalRequestedAmount: "",
                      });
                    }
                  }}
                />
                <h6 className="extention-show">
                  User can not post withdraw request less than this amount
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="user-table settings-table-container">
        <div className="settings-table-header user-table-top">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="w-100">
              <h4 className="settingboxheader settings-table-title m-0">
                Withdraw Payment Method
              </h4>
            </div>

            <div className="w-100 d-flex justify-content-end">
              <Button
                btnIcon={<IconPlus height={18} width={18} />}
                newClass={"settings-add-btn"}
                btnName={"New"}
                onClick={() => handleOpenNew("withdrawItem")}
              />
            </div>
          </div>
        </div>
        <div className="">
          <Table
            data={data}
            mapData={withdrawTable}
            PerPage={size}
            Page={page}
            type={"client"}
            handleSelectAll={handleSelectAll}
            selectAllChecked={selectAllChecked}
            loading={isLoading}
          />
          <div className="mt-3">
            <Pagination
              type={"client"}
              activePage={page}
              rowsPerPage={size}
              userTotal={withdrawData?.length}
              setPage={setPage}
              setData={setData}
              data={data}
              actionShow={false}
              actionPagination={actionPagination}
              setActionPagination={setActionPagination}
              paginationSubmitButton={paginationSubmitButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  getWithdrawalApi,
  isActivePaymentGetWay,
  editSetting,
})(PaymentGatewaySetting);
