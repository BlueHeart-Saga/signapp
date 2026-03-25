import {
  uploadDocument,
  uploadFromCloud
} from "../../services/DocumentAPI";

export async function handleLocalUpload(
  file,
  { onProgress, onSuccess, onError }
) {
  try {
    await uploadDocument(file, onProgress);
    onSuccess();
  } catch (e) {
    onError(e);
  }
}

export async function handleCloudUpload(
  provider,
  fileMeta,
  accessToken,
  callbacks
) {
  try {
    await uploadFromCloud(provider, fileMeta, {
      downloadFile: true,
      accessToken,
    });
    callbacks.onSuccess();
  } catch (e) {
    callbacks.onError(e);
  }
}
