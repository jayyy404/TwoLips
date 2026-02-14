import { ID, Permission, Query, Role } from "appwrite";
import { storage } from "../config/appwrite";
import { BUCKET_TEMPORARY_IMAGES } from "../config/constant";

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
 * Ensure we have a proper File object for uploaded.
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

export async function uploadSnapFile(photo: UploadablePhoto): Promise<string> {
  const fileId = ID.unique();

  const file = await toFile(photo);

  // 30s timeout — iOS Safari can hang on uploads if SW intercepts
  await withTimeout(
    storage.createFile(
      BUCKET_TEMPORARY_IMAGES,
      fileId,
      {
        name: file.name,
        type: file.type,
        size: file.size,
        uri: photo.uri,
      },
      FILE_PERMISSIONS,
    ),
    30000,
    "Appwrite file upload",
  );

  return fileId;
}
