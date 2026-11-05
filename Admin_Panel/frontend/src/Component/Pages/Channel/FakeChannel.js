import React, { useEffect, useState } from "react";
import { ReactComponent as TrashIcon } from "../../../assets/icons/trashIcon.svg";
import { ReactComponent as EditIcon } from "../../../assets/icons/EditBtn.svg";
import Button from "../../extra/Button";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import { connect, useDispatch, useSelector } from "react-redux";
import { OPEN_DIALOGUE } from "../../store/dialogue/dialogue.type";
import Selector from "../../extra/Selector";
import { ReactComponent as VideoIcon } from "../../../assets/icons/VideoTableIcon.svg";
import Input from "../../extra/Input";
import Searching from "../../extra/Searching";
import UserImage from "../../../assets/images/8.jpg";
import {
  getUserChannels,
  createChannelFakeUser,
  getFakeUserName,
  deleteChanel,
  cleanUserData,
} from "../../store/user/user.action";
import $ from "jquery";
import { warning } from "../../../util/Alert";
import { IconTrash } from "@tabler/icons-react";
import LazyImage from "../../../common/ImageFallback";
import UniqueIdCopy from "../../extra/UniqueIdCopy";
import { useTableParams } from "../../../util/useTableParams";
import { Skeleton } from "@mui/material";

function FakeChannel(props) {
  const dispatch = useDispatch();
  const { startDate, endDate } = props;
  const { params, updateParams, handleFilterChange } = useTableParams({
    page: 1,
    limit: 10,
    search: "",
  });
  const { page, limit, search } = params;
  const [, setSearch] = useState(search || "");
  const [data, setData] = useState();
  const { getFakeUserData, totalFakeUserData } = useSelector(
    (state) => state.user
  );
  const { isLoading } = useSelector((state) => state.dialogue);

  useEffect(() => {
    dispatch(getUserChannels(page, limit, startDate, endDate, "addByadmin", search || ""));
    return () => {
      dispatch(cleanUserData())
    };
  }, [dispatch, startDate, endDate, page, limit, search]);

  useEffect(() => {
    setData(getFakeUserData);
  }, [getFakeUserData]);

  const handleServerSearch = (value) => {
    handleFilterChange({ search: value || "" });
  };
  const handlePageChange = (pageNumber) => {
    updateParams({ page: pageNumber });
  };

  const handleRowsPerPage = (value) => {
    updateParams({ limit: value, page: 1 });
  };
  $(document).ready(function () {
    $("img").bind("error", function () {
      // Set the default image
      $(this).attr("src", UserImage);
    });
  });

  const handleDeleteChanel = (row) => {

    const data = warning();
    data
      .then((res) => {
        if (res) {
          const yes = res.isConfirmed;
          if (yes) {
            const id = row?.channelId;
            dispatch(deleteChanel(id));
          }
        }
      })
      .catch((err) => console.log(err));
  };


  const channelFakeUser = [
    {
      Header: "NO",
      body: "no",
      Cell: ({ index }) => (
        <span className="  text-nowrap">
          {(page - 1) * limit + parseInt(index) + 1}
        </span>
      ),
    },
    {
      Header: "CHANNEL NAME",
      body: "fullName",
      Cell: ({ row, index }) => (
        <div className="d-flex align-items-center">
          {/* <img src={row?.image} width="50px" height="50px" /> */}
          <LazyImage imageSrc={row?.image} width="50px" height="50px" />
          <div className="ms-3 ">
            {/* Nick Name */}
            <div className="fw-semibold text-start text-capitalize">
              {row?.fullName || "-"}
            </div>

            {/* Full Name */}
            <div className="text-muted small text-start text-capitalize">
              {row?.nickName || "-"}
            </div>
            <div className="text-muted small text-start text-capitalize">
              <UniqueIdCopy value={row?.uniqueId} placeholder="-" />
            </div>
          </div>
        </div>
      ),
    },
    {
      Header: "EMAIL",
      body: "email",
      Cell: ({ row }) => (
        <span className="    cursorPointer">{row?.email}</span>
      ),
    },
    {
      Header: "CHANNEL ID",
      body: "channelId",
      Cell: ({ row }) => (
        <span className="text-capitalize  text-nowrap">{row?.channelId}</span>
      ),
    },
    {
      Header: "Total Subscribers",
      body: "totalSubscribers",
      Cell: ({ row }) => (
        <span className="text-capitalize  text-nowrap">{row?.totalSubscribers}</span>
      ),
    },

    {
      Header: "ACTION",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <button
            className="btn btn-sm"
            onClick={() => handleDeleteChanel(row)}
          >
            <IconTrash className="text-secondary" size={20} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="user-table mb-3">
        <div className="user-table-top">
          <div className=" d-flex justify-content-between w-100">
            <div className="w-100">

              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginBottom: "4px",
                  marginTop: "5px",
                }}
              >
                Fake Channel
              </h5>
            </div>
            <Searching
              actionShow={false}
              placeholder={"Search by name, uniqueId, email, channelId"}
              type={"server"}
              serverSearching={handleServerSearch}
              setSearchData={setSearch}
              className={"d-flex justify-content-end w-100"}
              value={search}
              loading={isLoading}
            />
          </div>
        </div>
        <Table
          data={isLoading ? Array(10).fill({}) : data}
          mapData={channelFakeUser.map((col) => ({
            ...col,
            Cell: (props) => {
              if (isLoading) {
                if (col.Header === "NO") {
                  return <Skeleton variant="text" width="20px" />;
                } else if (col.Header === "CHANNEL NAME") {
                  return (
                    <div className="d-flex align-items-center">
                      <Skeleton variant="square" sx={{ borderRadius: "10px" }} width={50} height={50} />
                      <div className="ms-3" style={{ flex: 1 }}>
                        <Skeleton variant="text" width="100px" height={20} />
                        <Skeleton variant="text" width="80px" height={15} />
                        <Skeleton variant="text" width="60px" height={15} />
                      </div>
                    </div>
                  );
                } else if (col.Header === "ACTION") {
                  return (
                    <div className="action-button">
                      <Skeleton variant="circular" width={30} height={30} />
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
          type={"server"}
        />
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={limit}
          actionShow={false}
          userTotal={totalFakeUserData}
          setPage={(pageNumber) => updateParams({ page: pageNumber })}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
export default connect(null, {
  getUserChannels,
  createChannelFakeUser,
  getFakeUserName,
})(FakeChannel);
