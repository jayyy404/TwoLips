import { ID, Permission, Query, Role } from "react-native-appwrite";
import { storage } from "../config/appwrite";
import { BUCKET_TEMPORARY_IMAGES } from "../config/constant";

export { ID, Query };

export interface UploadablePhoto {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  file?: File; // only on web
}

/*anyone can view the image, any logged-in user can delete it */
const FILE_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

export async function uploadSnapFile(photo: UploadablePhoto): Promise<string> {
  const fileId = ID.unique();
  await storage.createFile(
    BUCKET_TEMPORARY_IMAGES,
    fileId,
    {
      name: photo.fileName,
      type: photo.mimeType,
      size: photo.fileSize,
      uri: photo.uri,
    } as any,
    FILE_PERMISSIONS,
  );
  return fileId;
}
