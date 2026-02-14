// Appwrite Configuration

export const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
  "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";
// Platform is only used for Android native
export const APPWRITE_PLATFORM =
  process.env.EXPO_PUBLIC_APPWRITE_PLATFORM_ANDROID ?? "com.twolips.android";

// Database IDs
export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
export const COLLECTION_GARDEN = "garden";
export const COLLECTION_TEMPORARY_IMAGES = "temporary_images";

// Users collection (for push tokens)
export const COLLECTION_USERS = "users";

// Storage Bucket
export const BUCKET_TEMPORARY_IMAGES =
  process.env.EXPO_PUBLIC_APPWRITE_BUCKET_TEMPORARY_IMAGES ?? "";

// Single shared document for the garden poke feature
export const GARDEN_DOC_ID = "our_plot";

// OneSignal
export const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "";

// Hardcoded Users (two-person app)
export const USERS = {
  user_a: { id: "user_a", email: "crystaliza@twolips.app" },
  user_b: { id: "user_b", email: "jp@twolips.app" },
} as const;

/** Given the current user's ID, return the partner's ID */
export function getPartnerId(myUserId: string): string {
  return myUserId === USERS.user_a.id ? USERS.user_b.id : USERS.user_a.id;
}
// Animation Assets
export const ANIMATION_ASSETS: Record<string, any> = {
  flower: require("../../../assets/animations/flower_1.json"),
  sunflower: require("../../../assets/animations/flower_3.json"),
  pinklily: require("../../../assets/animations/flower_2.json"),
  blueflax: require("../../../assets/animations/flower_4.json"),
};

export const AVAILABLE_ANIMATIONS = [
  { name: "flower", emoji: "🌸", label: "Sakura" },
  { name: "sunflower", emoji: "🌻", label: "Sunflower" },
  { name: "pinklily", emoji: "🌺", label: "Pink Lily" },
  { name: "blueflax", emoji: "🪻", label: "Blue Flax" },
] as const;
