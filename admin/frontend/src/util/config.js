// Dynamic API URL for local development and cloud production
const isLocalhost = Boolean(
  typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]")
);

export const baseURL =
  process.env.REACT_APP_BASE_URL ||
  (isLocalhost
    ? "http://localhost:5000/"
    : "/");

export const secretKey = "0LF8bPi5BnOgl3JjLGcfhfU3N7TAk8rJ";
export const projectName = "YouPeak";
export const folderStructurePath = projectName;