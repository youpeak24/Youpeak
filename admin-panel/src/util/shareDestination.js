import { baseURL } from "./config";

const q = (v) => {
  if (v === undefined || v === null) return undefined;
  return Array.isArray(v) ? v[0] : v;
};

const normalizeBase = (websiteUrl) => {
  const raw = websiteUrl || baseURL;
  return raw.endsWith("/") ? raw : `${raw}/`;
};

const appendQuery = (url, params) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return url;
  const search = new URLSearchParams(
    Object.fromEntries(entries.map(([key, value]) => [key, String(value)]))
  ).toString();
  return `${url}?${search}`;
};

export const buildWebDestination = (params = {}, websiteUrl = "") => {
  const pageRoute = q(params.pageRoute);
  const id = q(params.id) ?? q(params.userId);
  const episodeNumber = q(params.episodeNumber);
  const movieName = q(params.movieName);
  const roomId = q(params.roomId);
  const liveUserId = q(params.liveUserId);

  if (!pageRoute) {
    return websiteUrl || baseURL;
  }

  const base = normalizeBase(websiteUrl);

  if (pageRoute === "video" || pageRoute === "videos") {
    if (!id) return websiteUrl || baseURL;
    return appendQuery(`${base}videos`, { videoId: id });
  }

  if (pageRoute === "short" || pageRoute === "shorts" || pageRoute === "reels") {
    if (!id) return websiteUrl || baseURL;
    return appendQuery(`${base}shorts`, { videoId: id });
  }

  if (pageRoute === "live") {
    return appendQuery(`${base}live`, { roomId, liveUserId });
  }

  if (pageRoute === "channel") {
    if (!id) return websiteUrl || baseURL;
    return `${base}channel/${encodeURIComponent(id)}`;
  }

  if (pageRoute === "movie" || pageRoute === "movies") {
    if (!id) return websiteUrl || baseURL;
    return appendQuery(`${base}movie/${encodeURIComponent(id)}`, {
      episodeNumber,
      movieName,
    });
  }

  if (pageRoute === "user-profile" || pageRoute === "profile" || pageRoute === "user") {
    if (!id) return websiteUrl || baseURL;
    return `${base}profile/${encodeURIComponent(id)}`;
  }

  if (id) {
    return `${base}${pageRoute}/${encodeURIComponent(id)}`;
  }

  return websiteUrl || baseURL;
};
