
import { useEffect } from "react";
import axios from "axios";

const AxiosInterceptor = () => {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // 401 = bad/expired token; ACCOUNT_DISABLED = the franchise was
        // deactivated or the partner suspended while they were logged in.
        if (
          error.response &&
          (error.response.status === 401 ||
            (error.response.status === 403 && error.response.data?.code === "ACCOUNT_DISABLED"))
        ) {
          sessionStorage.clear();
          if (error.response.status === 403 && error.response.data?.message) {
            // Shown once on the login page.
            try { sessionStorage.setItem("logoutReason", error.response.data.message); } catch (e) { /* ignore */ }
          }
          delete axios.defaults.headers.common["key"];
          delete axios.defaults.headers.common["Authorization"];
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return null;
};

export default AxiosInterceptor;
