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
    ? "http://localhost:5001/"
    : "/");

// Shared API key — must equal the backend `secretKey` env var.
// Set REACT_APP_SECRET_KEY in the Vercel project env.
export const secretKey = process.env.REACT_APP_SECRET_KEY || "";
export const projectName = "YouPeak";
export const folderStructurePath = projectName;