const db = require("../../util/connection");

// Shared date-range predicate. The admin frontend's date-range picker sends
// literal "All" for both bounds when no range is selected (see
// admin/frontend .../Dashboard.js startDateFormat/endDateFormat) — that
// means "don't filter", not "filter to a date literally named All".
function inRange(dateStr, startDate, endDate) {
  if (!startDate || !endDate || startDate === "All" || endDate === "All") return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);
  return d >= start && d <= end;
}

function isRangeActive(startDate, endDate) {
  return !!startDate && !!endDate && startDate !== "All" && endDate !== "All";
}

// get admin panel dashboard count
exports.dashboardCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!isRangeActive(startDate, endDate)) {
      const totalUsers = await db.count("users");
      const totalVideos = await db.count("videos", { videoType: 1 });
      const totalShorts = await db.count("videos", { videoType: 2 });
      const totalChannels = await db.count("channels");

      return res.status(200).send({
        status: true,
        message: "get admin panel dashboard count!",
        dashboard: {
          totalChannels: totalChannels || 0,
          totalVideos: totalVideos || 0,
          totalShorts: totalShorts || 0,
          totalUsers: totalUsers || 0,
        },
      });
    }

    // A real range is selected — the count cards should reflect how many of
    // each were CREATED within that window, not the all-time grand total,
    // otherwise picking a date range would visibly change nothing.
    const [users, videos, shorts, channels] = await Promise.all([
      db.find("users"),
      db.find("videos", { videoType: 1 }),
      db.find("videos", { videoType: 2 }),
      db.find("channels"),
    ]);
    const countInRange = (rows) => rows.filter((row) => inRange(row.createdAt, startDate, endDate)).length;

    return res.status(200).send({
      status: true,
      message: "get admin panel dashboard count!",
      dashboard: {
        totalChannels: countInRange(channels),
        totalVideos: countInRange(videos),
        totalShorts: countInRange(shorts),
        totalUsers: countInRange(users),
      },
    });
  } catch (error) {
    console.error("dashboardCount error:", error);
    return res.status(200).json({
      status: true,
      message: "Success",
      dashboard: { totalChannels: 0, totalVideos: 0, totalShorts: 0, totalUsers: 0 },
    });
  }
};

// Day-wise growth series for one of users / videos / shorts, scoped to an
// optional date range. The frontend fires this once per `type` ("User",
// "Video", "Short") and reads the field named for that type back out of the
// response — see admin/frontend .../dashboard.action.js getDashboardUserChart.
exports.chartAnalytic = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let collectionName = "users";
    let collectionQuery = {};
    let fieldName = "chartAnalyticOfUsers";
    if (type === "Short") {
      collectionName = "videos";
      collectionQuery = { videoType: 2 };
      fieldName = "chartAnalyticOfShorts";
    } else if (type === "Video") {
      collectionName = "videos";
      collectionQuery = { videoType: 1 };
      fieldName = "chartAnalyticOfVideos";
    }

    const rows = await db.find(collectionName, collectionQuery);

    // Group by calendar day (not by month name) so a real date range picked
    // in the UI actually reflects day-level movement, and so records from
    // different years never collapse into the same "Jan" bucket.
    const buckets = {};
    rows.forEach((row) => {
      if (!inRange(row.createdAt, startDate, endDate)) return;
      const d = new Date(row.createdAt);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const series = Object.keys(buckets)
      .sort()
      .map((key) => ({ _id: key, count: buckets[key] }));

    return res.status(200).send({
      status: true,
      message: "Analytics fetched successfully!",
      [fieldName]: series,
    });
  } catch (error) {
    console.error("chartAnalytic error:", error);
    return res.status(200).json({
      status: true,
      message: "Success",
      chartAnalyticOfUsers: [],
      chartAnalyticOfShorts: [],
      chartAnalyticOfVideos: [],
    });
  }
};

// Active vs blocked user split, scoped to an optional date range (by
// account creation date). Returned shape is a single object, not an array —
// see admin/frontend .../Dashboard.js activePercentageofUser /
// blockPercentageofUser, which read .activeUsers/.blockedUsers/.totalUsers
// directly off res.data.data.
exports.chartAnalyticOfactiveInactiveUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const users = await db.find("users");

    let activeUsers = 0;
    let blockedUsers = 0;
    users.forEach((u) => {
      if (!inRange(u.createdAt, startDate, endDate)) return;
      if (u.isBlock) blockedUsers += 1;
      else activeUsers += 1;
    });

    return res.status(200).send({
      status: true,
      message: "Success",
      data: {
        activeUsers,
        blockedUsers,
        totalUsers: activeUsers + blockedUsers,
      },
    });
  } catch (error) {
    console.error("chartAnalyticOfactiveInactiveUser error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
