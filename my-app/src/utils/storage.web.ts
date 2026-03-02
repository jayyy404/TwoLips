import { ID, Permission, Query, Role } from "appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  BUCKET_TEMPORARY_IMAGES,
} from "../config/constant";

export { ID, Query };

export interface UploadablePhoto {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  file?: File;
}
const FILE_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

/**
 * Ensure we have a proper File object for upload.
 * Avoids re-wrapping which can break on iOS Safari.
 */
async function toFile(photo: UploadablePhoto): Promise<File> {
  const name = photo.fileName || `snap_${Date.now()}.jpg`;
  const type = photo.mimeType || "image/jpeg";

  // If a raw File was provided, use it directly
  if (photo.file && photo.file instanceof File && photo.file.size > 0) {
    return photo.file;
  }

  // Fallback: fetch the URI and build a new File
  const response = await fetch(photo.uri);
  const blob = await response.blob();
  return new File([blob], name, { type });
}

/** Wrap a promise with a timeout to prevent hangs (iOS Safari) */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Upload a snap file directly via the Appwrite REST API.
 *
 * The Appwrite Web SDK v22's chunkedUpload uses `value instanceof File`
 * to locate the file in the payload.  After the Expo SDK 55 / Metro update
 * this instanceof check fails (bundler context mismatch), so we bypass the
 * SDK and build the multipart request ourselves.
 */
export async function uploadSnapFile(photo: UploadablePhoto): Promise<string> {
  const fileId = ID.unique();
  const file = await toFile(photo);

  const formData = new FormData();
  formData.append("fileId", fileId);
  formData.append("file", file, file.name);
  for (const perm of FILE_PERMISSIONS) {
    formData.append("permissions[]", perm);
  }

  const headers: Record<string, string> = {
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
  };

  // Replicate the cookie-fallback auth the SDK uses
  const cookieFallback = window.localStorage.getItem("cookieFallback");
  if (cookieFallback) {
    headers["X-Fallback-Cookies"] = cookieFallback;
  }

  const url = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_TEMPORARY_IMAGES}/files`;

  // 30s timeout — iOS Safari can hang on uploads if SW intercepts
  const response = await withTimeout(
    fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    }),
    30000,
    "Appwrite file upload",
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as any).message ||
        `Upload failed with status ${response.status}`,
    );
  }

  return fileId;
}
