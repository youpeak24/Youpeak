const db = require("../../util/connection");

// get login or not
exports.get = async (req, res) => {
  try {
    let login = await db.findOne("logins", {});
    if (!login) {
      login = await db.create("logins", { login: true }, "default_login");
    }
    return res.status(200).json({ status: true, message: "Success", login: login.login ?? true });
  } catch (error) {
    console.log("Login controller get error:", error);
    return res.status(200).json({ status: true, message: "Success", login: true });
  }
};
