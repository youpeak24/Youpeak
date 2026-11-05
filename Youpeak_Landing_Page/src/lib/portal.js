/**
 * YouPeak web membership portal client.
 *
 * Talks to the same backend and the same accounts as the Flutter app:
 *   - email + password accounts (loginType 4), with the email OTP the app uses
 *   - the login response carries a Firebase custom token; it is exchanged for
 *     an ID token over Firebase's public REST API (no SDK needed), and that ID
 *     token authorises every per-user call (/payment/createOrder, /profile …)
 *   - prices come from /client/portal/catalog, so the page always shows what
 *     the server will actually charge
 *
 * Configuration (Vite env, all public values — see .env.example):
 *   VITE_API_BASE_URL      backend origin, e.g. https://api.youpeak.app
 *   VITE_API_KEY           the same client key the app and admin panel ship with
 *   VITE_FIREBASE_API_KEY  Firebase web API key (public by design)
 *
 * Nothing here runs at import time except reading env, so the module is safe
 * to load during the prerender build.
 */

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

export const PORTAL_CONFIG = {
  apiBase: String(env.VITE_API_BASE_URL || "https://api.youpeak.app").replace(/\/+$/, ""),
  apiKey: String(env.VITE_API_KEY || ""),
  firebaseKey: String(env.VITE_FIREBASE_API_KEY || "AIzaSyA3LefltA4wG0htRi1mJM8rGYIjdNoeqjM"),
  adminPanelUrl: String(env.VITE_ADMIN_PANEL_URL || "https://admin.youpeak.app"),
};

/** Override the build-time config (used by the automated tests). */
export function configurePortal(overrides) {
  Object.assign(PORTAL_CONFIG, overrides);
}

const SESSION_KEY = "youpeak_portal_session";
const DEVICE_KEY = "youpeak_portal_device";

export class PortalError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = "PortalError";
    Object.assign(this, extra);
  }
}

/* ── tiny safe storage ─────────────────────────────────────────────────── */
function readStore(key) {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key, value) {
  try {
    if (typeof window === "undefined") return;
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode / blocked storage: the session just won't persist */
  }
}

/* ── session ───────────────────────────────────────────────────────────── */
let memorySession = null;
const listeners = new Set();

export function loadSession() {
  if (memorySession) return memorySession;
  try {
    const raw = readStore(SESSION_KEY);
    memorySession = raw ? JSON.parse(raw) : null;
  } catch {
    memorySession = null;
  }
  return memorySession;
}

function saveSession(session) {
  memorySession = session;
  writeStore(SESSION_KEY, session ? JSON.stringify(session) : null);
  listeners.forEach((fn) => fn(session));
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function logout() {
  saveSession(null);
}

function deviceId() {
  let id = readStore(DEVICE_KEY);
  if (!id) {
    id = `web-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    writeStore(DEVICE_KEY, id);
  }
  return id;
}

/* ── HTTP ──────────────────────────────────────────────────────────────── */
function assertConfigured() {
  if (!PORTAL_CONFIG.apiKey) {
    throw new PortalError(
      "The web portal isn't configured yet (missing VITE_API_KEY). Please use the YouPeak app, or contact support.",
      { code: "PORTAL_NOT_CONFIGURED" },
    );
  }
}

async function exchangeCustomToken(customToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${PORTAL_CONFIG.firebaseKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!data.idToken) throw new PortalError("We couldn't start your secure session. Please try again.", { code: "SESSION_FAILED" });
  return data;
}

async function refreshIdToken(session) {
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${PORTAL_CONFIG.firebaseKey}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`,
  });
  const data = await res.json().catch(() => ({}));
  if (!data.id_token) {
    saveSession(null);
    throw new PortalError("Your session has expired. Please log in again.", { code: "AUTH_EXPIRED" });
  }
  const next = {
    ...session,
    idToken: data.id_token,
    refreshToken: data.refresh_token || session.refreshToken,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  saveSession(next);
  return next;
}

async function currentIdToken() {
  let session = loadSession();
  if (!session) throw new PortalError("Please log in to continue.", { code: "AUTH_REQUIRED" });
  if (session.expiresAt - 60_000 <= Date.now()) session = await refreshIdToken(session);
  return session.idToken;
}

async function request(path, { method = "GET", body, query, auth = false } = {}) {
  assertConfigured();
  const url = new URL(`${PORTAL_CONFIG.apiBase}/api/${path.replace(/^\/+/, "")}`);
  if (query) Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  const headers = { key: PORTAL_CONFIG.apiKey, "content-type": "application/json" };
  if (auth) headers.authorization = `Bearer ${await currentIdToken()}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new PortalError("Couldn't reach YouPeak. Check your internet connection and try again.", { code: "NETWORK" });
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth) {
    saveSession(null);
    throw new PortalError(data.message || "Your session has expired. Please log in again.", { code: data.code || "AUTH_EXPIRED", status: 401 });
  }
  if (res.status === 401) {
    throw new PortalError("YouPeak rejected this website's access key. Please contact support.", { code: "KEY_REJECTED", status: 401 });
  }
  if (res.status >= 500) {
    throw new PortalError(data.message || "YouPeak had a problem. Please try again in a moment.", { code: "SERVER", status: res.status });
  }
  return data;
}

const need = (data, fallback) => {
  if (!data || data.status === false) throw new PortalError((data && data.message) || fallback, { code: data && data.code, data });
  return data;
};

/* ── catalog (public) ──────────────────────────────────────────────────── */
let catalogPromise = null;
export function fetchCatalog({ force = false } = {}) {
  if (!catalogPromise || force) {
    catalogPromise = request("client/portal/catalog")
      .then((d) => need(d, "Couldn't load plans."))
      .catch((e) => {
        catalogPromise = null;
        throw e;
      });
  }
  return catalogPromise;
}

export async function fetchAdCreditPacks() {
  const data = await request("client/adCredits/packs");
  return data && data.status !== false ? data : { packs: [] };
}

/* ── accounts ──────────────────────────────────────────────────────────── */
export async function accountState({ email, password }) {
  const data = await request("client/user/checkUser", { method: "POST", body: { email, password, loginType: 4 } });
  // new email -> { status:true, isLogin:false }, right password -> isLogin:true,
  // existing email + wrong password -> { status:false, isLogin:false }
  if (data.isLogin) return "EXISTS_OK";
  if (data.status === false) return "EXISTS_WRONG_PASSWORD";
  return "NEW";
}

export async function sendEmailOtp(email) {
  need(await request("client/otp/otpLogin", { method: "POST", body: { email } }), "Couldn't send the code.");
}

export async function verifyEmailOtp(email, otp) {
  need(await request("client/otp/verify", { method: "POST", body: { email, otp } }), "That code didn't match.");
}

export async function sendResetOtp(email) {
  need(await request("client/otp/create", { method: "POST", body: { email } }), "Couldn't send the code.");
}

export async function setNewPassword(email, newPassword) {
  need(
    await request("client/user/setPassword", { method: "POST", body: { email, newPassword, confirmPassword: newPassword } }),
    "Couldn't set the password.",
  );
}

/** Log in (or, for a brand-new email, create the account) and open the session. */
export async function signInWithPassword({ email, password, fullName }) {
  const data = need(
    await request("client/user/login", {
      method: "POST",
      body: { email, password, loginType: 4, identity: deviceId(), fcmToken: "no-fcm-token", ...(fullName ? { fullName } : {}) },
    }),
    "Couldn't sign you in.",
  );
  if (!data.firebaseCustomToken) throw new PortalError("We couldn't start your secure session. Please try again.", { code: "SESSION_FAILED" });
  const tokens = await exchangeCustomToken(data.firebaseCustomToken);
  const user = data.user || {};
  const session = {
    userId: String(user._id || user.id),
    email: user.email || email,
    name: user.fullName || fullName || "",
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + Number(tokens.expiresIn || 3600) * 1000,
  };
  saveSession(session);
  return { session, signUp: !!data.signUp };
}

/* ── signed-in calls ───────────────────────────────────────────────────── */
export async function fetchProfile() {
  const data = need(await request("client/user/profile", { auth: true }), "Couldn't load your profile.");
  return data.user;
}

export async function fetchTaskerTiers() {
  const data = await request("client/taskerTier/getAvailableTiers", { auth: true });
  return data.status === false ? null : data;
}

export async function fetchCreatorTiers() {
  const data = await request("client/creatorTier/getAvailableTiers", { auth: true });
  return data.status === false ? null : data;
}

/* ── payments ──────────────────────────────────────────────────────────── */
export async function createOrder(params) {
  return need(await request("client/payment/createOrder", { method: "POST", auth: true, body: params }), "Couldn't start the payment.");
}

export async function verifyPayment({ orderId, paymentId, signature }) {
  return request("client/payment/verify", { method: "POST", auth: true, body: { orderId, paymentId, signature } });
}

export async function orderStatus(orderId) {
  return request("client/payment/status", { auth: true, query: { orderId } });
}
