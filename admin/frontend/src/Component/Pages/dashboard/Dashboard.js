import { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import ReactApexChart from "react-apexcharts";
import { ReactComponent as VideoIcon } from "../../../assets/icons/VideoIcon.svg";
import { ReactComponent as UserTotalIcon } from "../../../assets/icons/UserSideBarIcon.svg";
import { ReactComponent as TotalChannelIcon } from "../../../assets/icons/ChannelIcon.svg";
import { ReactComponent as TotalShortsIcon } from "../../../assets/icons/ShortIcon.svg";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { connect, useDispatch, useSelector } from "react-redux";
import { getProfile } from "../../store/admin/admin.action";
import {
  getDashboardCount,
  getDashboardUserChart,
  getChartAnalyticOfActiveUser,
} from "../../store/dashboard/dashboard.action";
import DateRangePicker from "react-bootstrap-daterangepicker";
import {
  IconBrandYoutube,
  IconMovie,
  IconUser,
  IconVideo,
} from "@tabler/icons-react";
import { Skeleton } from "@mui/material";

const Dashboard = (props) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const {
    dashboardCount,
    chartAnalyticOfVideos,
    chartAnalyticOfShorts,
    chartAnalyticOfUsers,
    chartAnalyticOfActiveUser,
  } = useSelector((state) => state.dashboard);
  const { isLoading } = useSelector((state) => state.dialogue);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let label = [];
  let data = [];
  let dataVideo = [];
  let dataUser = [];
  let dataShort = [];
  let dataCount = [];

  const startDateFormat = (startDate) => {
    if (startDate === "All") return "All";
    return dayjs(startDate).isValid()
      ? dayjs(startDate).format("YYYY-MM-DD")
      : dayjs().subtract(7, "day").format("YYYY-MM-DD");
  };

  const endDateFormat = (endDate) => {
    if (endDate === "All") return "All";
    return dayjs(endDate).isValid()
      ? dayjs(endDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  };
  const startDateData = startDateFormat(startDate);
  const endDateData = endDateFormat(endDate);

  useEffect(() => {
    dispatch(getDashboardCount(startDateData, endDateData));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getDashboardUserChart(startDateData, endDateData, "Short"));
  }, [dispatch, startDate, endDate]);
  useEffect(() => {
    dispatch(getDashboardUserChart(startDateData, endDateData, "Video"));
  }, [dispatch, startDate, endDate]);
  useEffect(() => {
    dispatch(getDashboardUserChart(startDateData, endDateData, "User"));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    dispatch(getChartAnalyticOfActiveUser(startDateData, endDateData));
  }, [dispatch, startDate, endDate]);

  // Collect unique dates from all 3 analytics sources
  const userMap = new Map();
  chartAnalyticOfUsers?.forEach((data_) => {
    if (data_?._id) {
      label.push(data_._id);
      userMap.set(data_._id, data_?.count || 0);
    }
  });

  const videoMap = new Map();
  chartAnalyticOfVideos?.forEach((data_) => {
    if (data_?._id) {
      label.push(data_._id);
      videoMap.set(data_._id, data_?.count || 0);
    }
  });

  const shortMap = new Map();
  chartAnalyticOfShorts?.forEach((data_) => {
    if (data_?._id) {
      label.push(data_._id);
      shortMap.set(data_._id, data_?.count || 0);
    }
  });

  let labelSet = new Set(label);
  label = [...labelSet].sort((a, b) => new Date(a) - new Date(b));

  dataUser = label.map((d) => userMap.get(d) || 0);
  dataVideo = label.map((d) => videoMap.get(d) || 0);
  dataShort = label.map((d) => shortMap.get(d) || 0);
  var webSize = $(window).width();
  const resHeight =
    webSize >= 992 ? 500 : webSize < 992 && webSize > 576 ? 400 : 300;
  const resWidth = webSize < 576 ? 300 : 450;

  const totalSeries = {
    labels: label,
    dataSet: [
      {
        name: "Total User",
        data: dataUser,
      },
      {
        name: "Total Video",
        data: dataVideo,
      },
      {
        name: "Total Short",
        data: dataShort,
      },
    ],
  };

  const optionsTotal = {
    chart: {
      type: "area",
      stacked: false,
      height: "200px",
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    yaxis: {
      show: false,
    },
    xaxis: {
      categories: label,
      rotate: 0,
      rotateAlways: true,
      minHeight: 50,
      maxHeight: 100,
      labels: {
        offsetX: -4, // Adjust the offset vertically
        fontSize: 10,
      },
    },

    tooltip: {
      shared: true,
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetX: -10,
    },
    colors: ["#FD4D66", "#786D81", "#e91e63"],
  };

  // const activeUserData = chartAnalyticOfActiveUser?.reduce(function (acc, obj) {
  //   return acc + obj?.count;
  // }, 0);
  // const userData = chartAnalyticOfUsers?.reduce(function (acc, obj) {
  //   return acc + obj?.count;
  // }, 0);
  // const percentage = (activeUserData / userData) * 100;
  // const seriesGradient = [percentage ? percentage?.toFixed(0) : "0"];

  const activePercentageofUser = chartAnalyticOfActiveUser?.activeUsers
    ? (chartAnalyticOfActiveUser?.activeUsers /
        chartAnalyticOfActiveUser?.totalUsers) *
      100
    : 0;
  const blockPercentageofUser = chartAnalyticOfActiveUser?.blockedUsers
    ? (chartAnalyticOfActiveUser?.blockedUsers /
        chartAnalyticOfActiveUser?.totalUsers) *
      100
    : 0;
  const seriesGradient = [activePercentageofUser, blockPercentageofUser];

  const optionsGradient = {
    chart: {
      height: 400,
      width: 200,
      type: "radialBar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: 0,
        endAngle: 365,
        hollow: {
          margin: 0,
          size: "55%",
          background: "#1C1538",
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: "front",
          dropShadow: {
            enabled: false,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24,
          },
        },
        track: {
          background: "rgba(124, 92, 252, 0.15)",
          strokeWidth: "100%",
          margin: 0,
          dropShadow: {
            enabled: false,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.35,
          },
        },
        dataLabels: {
          show: true,
          name: {
            show: true,
            fontFamily: undefined,
            fontWeight: 700,
            fontSize: "17px",
            color: "#F0EEFF",
            offsetY: -10,
          },
          value: {
            formatter: function (val) {
              return parseInt(val) + "%";
            },
            color: "#059669",
            fontWeight: 600,
            fontSize: "30px",
            show: true,
          },
        },
      },
    },
    labels: ["Active Users" , "Blocked Users"],
    fill: {
      type: "solid",
      colors: ["#059669" , "#786d81"],
    },
    stroke: {
      lineCap: "round",
    },
    states: {
      hover: {
        filter: {
          type: "none", // Disables the hover effect
        },
      },
    },
  };

  const CustomeCard = ({ link, title, count, Icon }) => {
    return (
      <div
        className="col-xl-3 col-sm-6 col-12 cursor-pointer"
        onClick={() => navigate(link)}
      >
        <div className="card">
          {isLoading ? (
            <Skeleton variant="square" width="100%" height="135px" style={{ borderRadius: '15px' }} />
          ) : (
            <div className="card-content cursor-pointer">
              <div className="card-body p-4">
                <div className="align-content-center d-flex justify-content-between media">
                  <div className="media-body text-left">
                    <h3 className="warning">{count}</h3>
                    <span className="fw-medium">{title}</span>
                  </div>
                  <div className="align-self-center">
                    {<Icon className={"dashboard-card-icon"} />}
                  </div>
                </div>
                <div className="progress mt-2 mb-0" style={{ height: 7 }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: "50%" }}
                    aria-valuenow={50}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dashboard " style={{marginTop: "0px" }}>
        <div className="dashboardHeader primeHeader !mb-0 !p-0">
          <h4 className="heading-dashboard fw-semibold d-block">
            Welcome Admin !
          </h4>
          <NewTitle
            dayAnalyticsShow={true}
            titleShow={true}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            name={`Dashboard`}
          />
        </div>
        <div className="dashBoardMain px-2 mt-4">
          <div className="row dashboard-count-box">
            <CustomeCard
              link={"/admin/userTable"}
              title={"Total User"}
              count={
                dashboardCount?.totalUsers ? dashboardCount?.totalUsers : "0"
              }
              Icon={IconUser}
            />

            <CustomeCard
              link={"/admin/channel"}
              title={"Total Channel"}
              count={
                dashboardCount?.totalChannels
                  ? dashboardCount?.totalChannels
                  : "0"
              }
              Icon={IconBrandYoutube}
            />
            <CustomeCard
              link={"/admin/videos"}
              title={"Total Video"}
              count={
                dashboardCount?.totalVideos ? dashboardCount?.totalVideos : "0"
              }
              Icon={IconVideo}
            />
            <CustomeCard
              link={"/admin/shorts"}
              title={"Total Shorts"}
              count={
                dashboardCount?.totalShorts ? dashboardCount?.totalShorts : "0"
              }
              Icon={IconMovie}
            />
          </div>
          <div className="dashboard-analytics">
            <h6 className="">Data Analytics</h6>
            <div className="row dashboard-chart justify-content-between">
              <div
                className="col-lg-9 col-md-12 col-sm-12 mt-lg-0 mt-4 dashboard-chart-box"
                style={{ position: "relative" }}
              >
                <div
                  id="chart"
                  className="dashboard-user-count"
                  style={{ height: "100%" }}
                >
                  <div className="date-range-picker mb-2 pb-2"></div>
                  <div className="">
                    {isLoading ? (
                      <Skeleton variant="rectangular" width="100%" height={resHeight} style={{ borderRadius: '15px' }} />
                    ) : (
                      <ReactApexChart
                        options={optionsTotal}
                        series={
                          totalSeries.dataSet.length >= 1
                            ? totalSeries.dataSet
                            : ""
                        }
                        type="area"
                        height={resHeight}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-12  col-sm-12 mt-3 mt-lg-0 dashboard-total-user">
                <div className="user-activity">
                  <div className="border-bottom p-3">
                    <h6 className="m-0">Total User Activity</h6>
                  </div>
                  <div
                    id="chart"
                    style={{ display: "flex", justifyContent: "center" }}
                    className="p-3"
                  >
                    {isLoading ? (
                      <Skeleton variant="circular" width={resWidth - 100} height={resWidth - 100} />
                    ) : (
                      <ReactApexChart
                        options={optionsGradient}
                        series={seriesGradient}
                        type="radialBar"
                        width={resWidth}
                        height={resWidth === 300 ? 300 : 360}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="total-user-chart">
                      <span></span>
                      <h5>Total Active User</h5>
                    </div>
                    <div className="total-active-chart">
                      <span></span>
                      <h5>Total Block User</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default connect(null, {
  getProfile,
  getDashboardCount,
  getDashboardUserChart,
  getChartAnalyticOfActiveUser,
})(Dashboard);
