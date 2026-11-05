const OTP = require("../../models/otp.model");
const crypto = require("crypto");
const db = require("../../util/connection");

//resend
const { Resend } = require("resend");

//import model
const User = require("../../models/user.model");

// A 4-digit code is guessable, so each code allows MAX_VERIFY_ATTEMPTS wrong
// guesses and each email gets MAX_CODES_PER_HOUR codes: at most 25 guesses an
// hour against 9,000 codes, instead of unlimited guesses in the 5 minutes.
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_CODES_PER_HOUR = 5;
// How long a verified code authorises the forgot-password reset
// (client/user.controller.js setPassword).
const RESET_GRANT_MINUTES = 10;

// Stores a fresh code for this email. Returns null while the hourly cap is used up.
async function issueOtp(email) {
  const now = Date.now();
  const newOtp = crypto.randomInt(1000, 10000);
  const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes

  const existOTP = await OTP.findOne({ email });
  if (existOTP) {
    const windowStart = existOTP.windowStartedAt ? new Date(existOTP.windowStartedAt).getTime() : 0;
    const inWindow = now - windowStart < 3600e3;
    const issued = inWindow ? Number(existOTP.issuedInWindow) || 0 : 0;
    if (issued >= MAX_CODES_PER_HOUR) return null;
    existOTP.otp = newOtp;
    existOTP.expiresAt = expiresAt;
    existOTP.failedAttempts = 0;
    existOTP.issuedInWindow = issued + 1;
    if (!inWindow) existOTP.windowStartedAt = new Date(now).toISOString();
    await existOTP.save();
  } else {
    const otp = new OTP();
    otp.email = email;
    otp.otp = newOtp;
    otp.expiresAt = expiresAt;
    otp.failedAttempts = 0;
    otp.issuedInWindow = 1;
    otp.windowStartedAt = new Date(now).toISOString();
    await otp.save();
  }
  return newOtp;
}

const TOO_MANY_CODES = "Too many codes requested for this email. Please try again in an hour.";

//create OTP when user login
exports.otplogin = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(200).json({ status: false, message: "Email must be requried." });
    }

    const newOtp = await issueOtp(req.body.email.trim());
    if (newOtp === null) return res.status(200).json({ status: false, message: TOO_MANY_CODES });

    var tab = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      h2 {
        color: #333;
      }
      p {
        color: #666;
      }
      .otp {
        margin: 20px 0;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 17px
      }
      .support {
        color: #007bff;
        text-decoration: none;
      }
    </style>

    </head>
    <body>
      <div class="container">
        <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div class="otp">
          <b>OTP: ${newOtp}</b>
          <p>(Note: This OTP is valid for a limited time, so make sure to use it promptly.)</p>
        </div>

        <p>If you encounter any issues during the verification process or have any questions, feel free to <a class="support" href="#">reach out to our support team</a>.</p>
      </div>
    </body>
    </html>`;

    const resend = new Resend(settingJSON?.resendApiKey);
    const response = await resend.emails.send({
      from: `${process?.env?.EMAIL}`,
      to: req?.body?.email?.trim(),
      subject: `Sending Email from ${process?.env?.appName}`,
      html: tab,
    });

    if (response.error) {
      console.error("Error sending email via Resend:", response.error);
      return res.status(500).json({
        status: false,
        message: "Failed to send OTP email",
        error: response.error.message,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//create OTP and send the email for password security
exports.store = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(200).json({ status: false, message: "Email must be requried." });
    }

    const userEmail = await User.findOne({ email: req.body.email.trim() });
    if (!userEmail) {
      return res.status(200).json({ status: false, message: "User does not found with that email." });
    }

    const newOtp = await issueOtp(req.body.email.trim());
    if (newOtp === null) return res.status(200).json({ status: false, message: TOO_MANY_CODES });

    var tab = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      h2 {
        color: #333;
      }
      p {
        color: #666;
      }
      .otp {
        margin: 20px 0;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 17px
      }
      .support {
        color: #007bff;
        text-decoration: none;
      }
    </style>

    </head>
    <body>
      <div class="container">
        <b style="font-size: 20px">Hello </b><b style="color: green; font-size: 20px">${userEmail.fullName},</b>
        <br>

        <p>Please use the following One-Time Password (OTP) for Password Security:</p>
        <div class="otp">
          <b>OTP: ${newOtp}</b>
          <p>(Note: This OTP is valid for a limited time, so make sure to use it promptly.)</p>
        </div>

        <p>If you encounter any issues during the verification process or have any questions, feel free to <a class="support" href="#">reach out to our support team</a>.</p>
      </div>
    </body>
    </html>`;

    const resend = new Resend(settingJSON?.resendApiKey);
    const response = await resend.emails.send({
      from: `${process?.env?.EMAIL}`,
      to: req.body.email,
      subject: `Sending Email from ${process?.env?.appName} for Password Security`,
      html: tab,
    });

    if (response.error) {
      console.error("Error sending email via Resend:", response.error);
      return res.status(500).json({
        status: false,
        message: "Failed to send OTP email",
        error: response.error.message,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//verify the OTP
exports.verify = async (req, res) => {
  try {
    if (!req.body.email || !req.body.otp) {
      return res.status(200).json({ status: false, message: "OTP and email must be requried!" });
    }

    const email = req.body.email.trim();
    const otpUser = await OTP.findOne({ email });
    // otp is null once a code is used up — the document stays to keep the
    // hourly code count (issueOtp).
    if (!otpUser || otpUser.otp == null) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (new Date(otpUser.expiresAt) < new Date()) {
      otpUser.otp = null;
      await otpUser.save();
      return res.status(200).json({ status: false, message: "OTP has expired!" });
    }

    if (parseInt(req.body.otp) === Number(otpUser.otp)) {
      otpUser.otp = null;
      await otpUser.save();

      const owner = await db.findOne("users", { email });
      if (owner) {
        await db.update("users", owner._id || owner.id, {
          passwordResetGrantUntil: new Date(Date.now() + RESET_GRANT_MINUTES * 60e3).toISOString(),
        });
      }

      return res.status(200).json({
        status: true,
        message: "OTP Verified Successfully!",
      });
    }

    otpUser.failedAttempts = (Number(otpUser.failedAttempts) || 0) + 1;
    if (otpUser.failedAttempts >= MAX_VERIFY_ATTEMPTS) otpUser.otp = null;
    await otpUser.save();
    return res.status(200).json({
      status: false,
      message: otpUser.otp == null ? "Too many wrong attempts. Please request a new OTP." : "OTP does not match!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
