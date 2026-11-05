import React, { useEffect, useState } from "react";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import Searching from "../../extra/Searching";
import { connect, useDispatch, useSelector } from "react-redux";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import {
  getSoundCategory,
  deleteSoundCategory,
} from "../../store/sound/sound.action";
import { warning } from "../../../util/Alert";
import noImageFound from "../../../assets/images/noimage.png";
import AddIcon from "@mui/icons-material/Add";
import SoundCategoryAdd from "../../dialogue/SoundCategoryAdd";
import UserImage from "../../../assets/images/8.jpg";
import $ from "jquery";
import ToggleSwitch from "../../extra/ToggleSwitch";
import { IconEdit, IconPlug, IconPlus, IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function SoundCategory(props) {
  const { startDate, endDate, multiButtonSelectData } = props;
  const dispatch = useDispatch();
  const [checkBox, setCheckBox] = useState();
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [verificationRequests, setVerificationRequests] = useState();
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const [data, setData] = useState([]);

  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const [showURLs, setShowURLs] = useState([]);
  const { soundCategoryData, totalSoundCategory } = useSelector((state) => state.sound);
  const { isLoading } = useSelector((state) => state.dialogue);

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

  const paginationSubmitButton = () => {

    const selectCheckDataGetId = selectCheckData?.map((item) => item?._id);
    if (actionPagination === "delete" && selectCheckDataGetId?.length > 0) {
      const data = warning();
      data
        .then((res) => {
          if (res) {
            const yes = res.isConfirmed
            if (yes) {
              props.deleteSoundCategory(selectCheckDataGetId);
            }
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const handleDeleteVideo = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed
          if (yes) {
            const id = row?._id;
            props.deleteSoundCategory(id);
          }
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [data]);

  const fetchData = async () => {
    if (!data || data.length === 0) {
      return;
    }

    const urls = (
      data.map((item) => {
        const fileNameWithExtension = item?.image
        return fileNameWithExtension;
      })
    );
    setShowURLs(urls);
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

  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };

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

  const soundCategoryMapData = [
    {
      Header: "checkBox",
      width: "20px",
      Cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectCheckData.some(
            (selectedRow) => selectedRow?._id === row?._id
          )}
          onChange={(e) => handleSelectCheckData(e, row)}
        />
      ),
    },
    {
      Header: "NO",
      body: "no",
      Cell: ({ index }) => (
        <span className="  text-nowrap">{(page - 1) * limit + index + 1}</span>
      ),
    },
    {
      Header: "IMAGE",
      body: "image",
      Cell: ({ row, index }) => (
        <div className="d-flex justify-content-center">
          <LazyImage imageSrc={row?.image} width="50px" height="50px" />
        </div>
      ),
    },
    {
      Header: "CATEGORY NAME",
      body: "name",
      Cell: ({ row }) => <span className="text-capitalize">{row?.name}</span>,
    },
    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">

          <button
            className="btn btn-sm"
            onClick={() => handleEdit(row, "addCategory")}
          >
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
    dispatch(getSoundCategory(page, limit, startDate, endDate, search || ""));
  }, [dispatch, page, limit, startDate, endDate, search]);

  useEffect(() => {
    setData(soundCategoryData);
  }, [soundCategoryData]);

  const isSubmitDisabled = !selectCheckData || selectCheckData.length === 0;

  return (
    <div>
      <div className="user-table">
        {dialogueType == "addCategory" && <SoundCategoryAdd />}
        <div className="user-table-top">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="w-100">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",

                }}
              >
                Sound Category
              </h5>
            </div>
            <div className="d-flex justify-content-end w-100">

              <Searching
                placeholder={"Search by name"}
                label={"Search for Keyword, Category Name"}
                type={"server"}
                serverSearching={handleServerSearch}
                setSearchData={setSearch}
                value={search}
                customSelectDataShow={true}
                customSelectData={["Delete"]}
                actionPagination={actionPagination}
                setActionPagination={setActionPagination}
                paginationSubmitButton={paginationSubmitButton}
                isSubmitDisabled={isSubmitDisabled}
                hideActionDropdown={true}
                actionButtonLabel={"Delete"}
                className={"d-flex justify-content-end"}
              />
              <Button
                btnIcon={<IconPlus width={18} height={18} />}
                btnName={"New"}
                newClass={"ms-3"}
                onClick={() => handleOpenNew("addCategory")}
              />
            </div>
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={soundCategoryMapData.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "checkBox") {
                  return <Skeleton variant="circular" width={20} height={20} />;
                } else if (col.Header === "NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "IMAGE") {
                  return (
                    <div className="d-flex justify-content-center">
                      <Skeleton variant="square" sx={{ borderRadius: "10px" }} width={50} height={50} />
                    </div>
                  );
                } else if (col.Header === "ACTION") {
                  return (
                    <div className="action-button">
                      <Skeleton variant="circular" width={25} height={25} />
                      <Skeleton variant="circular" width={25} height={25} className="ms-2" />
                    </div>
                  );
                } else {
                  return <Skeleton variant="text" width="80%" height={20} />;
                }
              }
              return col.Cell ? <col.Cell {...props} /> : props.row[col.body];
            },
          }))}
          serverPerPage={limit}
          serverPage={page}
          handleSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          type={"server"}
        />
        <div className="mt-3">
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={limit}
            userTotal={totalSoundCategory}
            setPage={(pageNumber) => updateParams({ page: pageNumber })}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  getSoundCategory,
  deleteSoundCategory,
})(SoundCategory);
