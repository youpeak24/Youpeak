import "./App.css";
import { Route, Routes } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Admin from "./Component/Pages/Admin";
import Login from "./Component/Pages/Login";
import PrivateRoute from "./util/PrivateRoute";
import ForgotPassword from "./Component/Pages/ForgotPassword";
import SetPassword from "./Component/Pages/SetPassword";
import { useDispatch } from "react-redux";
import { LOGIN_ADMIN } from "./Component/store/admin/admin.type";
import axios from "axios";
import Registration from "./Component/Pages/Registration";
import Updatecode from "./Component/Pages/Updatecode";
import SharePage from "./Component/Pages/Share/SharePage";

function App() {
  const dispatch = useDispatch();
  const key = sessionStorage.getItem("key");
  const token = sessionStorage.getItem("token");
  const [login, setLogin] = useState(true);

  useEffect(() => {
    axios
      .get("admin/login")
      .then((res) => {
        if (typeof res.data?.login === "boolean") {
          setLogin(res.data.login);
        } else {
          setLogin(true);
        }
      })
      .catch((err) => {
        console.log(err);
        setLogin(true);
      });
  }, []);

  useEffect(() => {
    if (!token && !key) return;
    dispatch({ type: LOGIN_ADMIN, payload: token });
  }, [token, key, dispatch]);

  return (
      <div className="App">
        <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/changePassword" element={<SetPassword />} />

        {login === true && (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/code" element={<Updatecode />} />
          </>
        )}

        {login === false && (
          <>
            <Route path="/" element={<Registration />} />
            <Route path="/login" element={<Registration />} />
          </>
        )}

        <Route element={<PrivateRoute />}>
          <Route path="/admin/*" element={<Admin />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
