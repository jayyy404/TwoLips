import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface PhotoResult {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  file?: File;
}

/*Request camera permissions*/
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== "granted") {
    Alert.alert("Camera Permission", "Camera access is needed to send snaps.", [
      { text: "OK" },
    ]);
    return false;
  }
  return true;
}

/*Take a selfie using the front camera.*/
export async function takePhoto(): Promise<PhotoResult | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      allowsEditing: false,
      exif: false,
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];

    // Mirror the image horizontally (selfie mirror effect) needs to be modified
    let finalUri = asset.uri;
    try {
      const ImageManipulator = require("expo-image-manipulator");
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );
      finalUri = manipulated.uri;
    } catch (e) {
      console.warn("Mirror failed, using original:", e);
    }

    return {
      uri: finalUri,
      fileName: asset.fileName ?? `snap_${Date.now()}.jpg`,
      fileSize: asset.fileSize ?? 0,
      mimeType: asset.mimeType ?? "image/jpeg",
    };
  } catch (e) {
    console.error("Error taking photo:", e);
    throw e;
  }
}
