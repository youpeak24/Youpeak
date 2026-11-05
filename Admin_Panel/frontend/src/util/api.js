import {
  CLOSE_LOADER,
  LOADER_OPEN,
} from "../Component/store/dialogue/dialogue.type";
import { baseURL, secretKey } from "./config";
import store from "../Component/store/Provider";
import axios from "axios";

export const openSpinner = (method) => {
  return store.dispatch({ type: LOADER_OPEN, payload: { method } });
};

export const closeSpinner = () => {
  return store.dispatch({ type: CLOSE_LOADER });
};
export const apiInstanceFetch = {
  baseURL: `${baseURL}`, 

  get: (url) => {
    const token = sessionStorage.getItem("token");
    openSpinner("get");
    return fetch(`${apiInstanceFetch?.baseURL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        key: `${secretKey}`,
        Authorization: `${token}`,
      },
    })
      .then(handleErrors)
      .finally(() => closeSpinner());
  },

  post: (url, data) => {
    const token = sessionStorage.getItem("token");
    openSpinner("post");
    return fetch(`${apiInstanceFetch.baseURL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        key: `${secretKey}`,
        Authorization: `${token}`,
      },
      body: JSON.stringify(data),
    })
      .then(handleErrors)
      .finally(() => closeSpinner());
  },

  patch: (url, data) => {
    const token = sessionStorage.getItem("token");
    openSpinner("patch");
    return fetch(`${apiInstanceFetch.baseURL}${url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        key: `${secretKey}`,
        Authorization: `${token}`,
      },
      body: JSON.stringify(data),
    })
      .then(handleErrors)
      .finally(() => closeSpinner());
  },

  put: (url, data) => {
    const token = sessionStorage.getItem("token");
    openSpinner("put");
    return fetch(`${apiInstanceFetch.baseURL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        key: `${secretKey}`,
        Authorization: `${token}`,
      },
      body: JSON.stringify(data),
    })
      .then(handleErrors)
      .finally(() => closeSpinner());
  },

  delete: (url) => {
    const token = sessionStorage.getItem("token");
    openSpinner("delete");
    return fetch(`${apiInstanceFetch.baseURL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        key: `${secretKey}`,
        Authorization: `${token}`,
      },
    })
      .then(handleErrors)
      .finally(() => closeSpinner());
  },
};

function handleErrors(response) {
  if (response.ok === false) {
    if (response?.status === 401) {
      window.location.href = "/";
    }
    throw new Error(`HTTP error! Status: ${response?.status}`);
  }
  return response.json();
}
