const MAX_DIMENSION = 1280;

const MAX_FILE_SIZE = 1 * 1024 * 1024;

export interface PhotoResult {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  file: File;
}

/*Request camera permissions*/
export async function requestCameraPermission(): Promise<boolean> {
  return true;
}
function resizeAndMirror(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas 2d context"));
          return;
        }
        // Flip horizontally
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              if (blob.size > MAX_FILE_SIZE) {
                canvas.toBlob(
                  (blob2) => {
                    if (blob2 && blob2.size > 0) {
                      resolve(blob2);
                    } else {
                      resolve(blob); // fallback to original
                    }
                  },
                  "image/jpeg",
                  0.5,
                );
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error("canvas.toBlob returned empty result"));
            }
          },
          "image/jpeg",
          0.72,
        );
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image for mirroring"));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert any image File (including HEIC from iOS) to JPEG via canvas.
 */
function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Down-scale if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              const name =
                file.name.replace(/\.\w+$/, ".jpg") || `snap_${Date.now()}.jpg`;
              if (blob.size > MAX_FILE_SIZE) {
                canvas.toBlob(
                  (blob2) => {
                    const b = blob2 && blob2.size > 0 ? blob2 : blob;
                    resolve(new File([b], name, { type: "image/jpeg" }));
                  },
                  "image/jpeg",
                  0.5,
                );
              } else {
                resolve(new File([blob], name, { type: "image/jpeg" }));
              }
            } else {
              reject(new Error("JPEG conversion produced empty blob"));
            }
          },
          "image/jpeg",
          0.72,
        );
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for JPEG conversion"));
    };

    img.src = objectUrl;
  });
}

/**
 * Take a photo using the web camera / file picker.
 */
export async function takePhoto(): Promise<PhotoResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "user";

    // iOS Safari PWA requires the input to be in the DOM
    input.style.position = "fixed";
    input.style.top = "-9999px";
    input.style.left = "-9999px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    let resolved = false;
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = async () => {
      if (resolved) return;
      resolved = true;

      const rawFile = input.files?.[0];
      cleanup();

      if (!rawFile) {
        resolve(null);
        return;
      }

      console.log(
        `Image selected: ${rawFile.name}, ${rawFile.size} bytes, type: ${rawFile.type}`,
      );

      if (rawFile.size === 0) {
        console.error("File has 0 bytes");
        resolve(null);
        return;
      }

      const fileName = rawFile.name || `snap_${Date.now()}.jpg`;

      try {
        const blob = await resizeAndMirror(rawFile);
        const file = new File([blob], fileName.replace(/\.\w+$/, ".jpg"), {
          type: "image/jpeg",
        });
        const uri = URL.createObjectURL(file);

        console.log("Mirrored file ready:", file.size, "bytes");
        resolve({
          uri,
          fileName: file.name,
          fileSize: file.size,
          mimeType: "image/jpeg",
          file,
        });
      } catch (e) {
        console.warn("Mirror/resize failed, converting to JPEG:", e);

        try {
          const jpegFile = await convertToJpeg(rawFile);
          const uri = URL.createObjectURL(jpegFile);

          console.log("JPEG fallback ready:", jpegFile.size, "bytes");
          resolve({
            uri,
            fileName: jpegFile.name,
            fileSize: jpegFile.size,
            mimeType: "image/jpeg",
            file: jpegFile,
          });
        } catch (e2) {
          console.warn("JPEG conversion also failed, using raw file:", e2);
          // Last resort: use raw file as-is
          const uri = URL.createObjectURL(rawFile);
          resolve({
            uri,
            fileName,
            fileSize: rawFile.size,
            mimeType: rawFile.type || "image/jpeg",
            file: rawFile,
          });
        }
      }
    };

    // iOS Safari doesn't fire oncancel — use focus listener as fallback
    const focusHandler = () => {
      setTimeout(() => {
        if (!resolved && (!input.files || input.files.length === 0)) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      }, 500);
    };
    window.addEventListener("focus", focusHandler, { once: true });

    // Also listen for the standard cancel event
    input.oncancel = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      window.removeEventListener("focus", focusHandler);
      resolve(null);
    };

    input.click();
  });
}
