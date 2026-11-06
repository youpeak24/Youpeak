import { baseURL } from "./config";

const isLocalhost = () =>
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

// A readable message for a failed API call. axios reports an unreachable
// server, a refused connection, a blocked CORS preflight and a mixed-content
// (https page → http API) request all as the bare "Network Error", which
// tells the admin nothing; say which server could not be reached instead.
export const describeApiError = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;
  if (error.response) {
    const data = error.response.data;
    return (data && (data.message || data.error)) || `The server answered with an error (HTTP ${error.response.status}).`;
  }
  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
    return "The YouPeak server took too long to respond. Please try again.";
  }
  if (error.request || error.message === "Network Error") {
    const target = baseURL && baseURL !== "/" ? baseURL : "the YouPeak API";
    return isLocalhost()
      ? `Cannot reach the API at ${target}. Start the isolated local stack with "node tools/local-dev/start.js" and sign in at http://localhost:3055.`
      : `Cannot reach ${target}. Please check your connection and try again.`;
  }
  return error.message || fallback;
};
