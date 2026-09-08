const express = require("express");
const route = express.Router();

// Public Grievance Officer Page Data (IT Rules 2021 Compliance)
route.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Grievance Officer details fetched successfully.",
    data: {
      officerName: "Mr. Compliance Officer",
      designation: "Grievance Officer",
      companyName: "Youpeak Digital Solutions Pvt Ltd",
      contactEmail: "grievance@youpeak.in",
      contactPhone: "+91-0000000000",
      address: "Trichy, Tamil Nadu, India",
      workingHours: "Monday to Friday, 10:00 AM to 6:00 PM IST",
      statutoryTurnaroundTime: "36 Hours for critical takedowns (as per IT Rules 2021)",
      reportingMechanism: "Users can report content in-app or via email. Statutory action will be taken within 36 hours for violations affecting sovereignty, integrity, or public order.",
    }
  });
});

module.exports = route;
