

  

import axios from "axios";
import { UPLOAD_FILE_AWS } from "../Component/store/dialogue/dialogue.type";
import {
  LOADER_OPEN,
  CLOSE_LOADER,
} from "../Component/store/dialogue/dialogue.type";
import store from "../Component/store/Provider";
import { folderStructurePath } from "./config";


export const uploadFile = async (FileName, folderStructure, dispatch, loaderType) => {
        store.dispatch({ type: LOADER_OPEN, payload: "upload-file" });

  try {
    const onProgress = (percent) => dispatch && dispatch({ type: UPLOAD_FILE_AWS, payload: { uploadFilePercent: percent, loaderType } });
    const video = /^video\//i.test(FileName?.type || "") || /\.(mp4|mov|webm|m4v|mkv|avi|3gp)$/i.test(FileName?.name || "");
    if (video) {
      const types = { mov: "video/quicktime", webm: "video/webm", m4v: "video/x-m4v", mkv: "video/x-matroska", avi: "video/x-msvideo", "3gp": "video/3gpp" };
      const extension = String(FileName.name || "").split(".").pop().toLowerCase();
      const contentType = (FileName.type || types[extension] || "video/mp4").split(";")[0];
      const { data } = await axios.post("admin/file/direct-upload-url", { folderStructure, keyName: FileName.name, contentType });
      if (data.status !== true || !data.uploadURL || !data.publicUrl) throw new Error(data.message || "Could not start video upload.");
      onProgress(0);
      // Never send our admin JWT/shared headers to the storage provider.
      const uploaded = await fetch(data.uploadURL, { method: "PUT", headers: { "Content-Type": contentType }, body: FileName });
      if (!uploaded.ok) throw new Error("Video upload failed. Please try again.");
      onProgress(100);
      return { resDataUrl: data.publicUrl };
    }
    const formData = new FormData();
    formData.append("folderStructure", folderStructurePath + "/" + folderStructure);
    formData.append("keyName", FileName?.name);
    formData.append("content", FileName);

    const response = await axios.post(`admin/file/upload-file`, formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
        dispatch &&
          dispatch({
            type: UPLOAD_FILE_AWS,
            payload: {
              uploadFilePercent: percentCompleted, 
              loaderType: loaderType,
            },
          });
      },
    });

    // ✅ Backend से permanent URL मिलेगा
    if (response.data.status !== true || !response.data.url) throw new Error(response.data.message || "Upload failed.");
    const resDataUrl = response.data.url;
    return { resDataUrl };
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    store.dispatch({ type: CLOSE_LOADER, payload: "upload-file" });
  }
};

