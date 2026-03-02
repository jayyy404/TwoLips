const DEFAULT_ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "";
const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
  }
}

/** Resolved app ID — set once during initializeOneSignal */
let resolvedAppId: string = DEFAULT_ONESIGNAL_APP_ID;

let sdkLoadPromise: Promise<void> | null = null;

// Load the OneSignal SDK script

function loadSDK(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    // If already loaded
    if (window.OneSignal) {
      resolve();
      return;
    }

    // Set up the deferred queue before loading
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Create script element
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("Failed to load OneSignal SDK"));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

// Initialize OneSignal

export async function initializeOneSignal(appId?: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Use the explicitly passed appId, falling back to the env variable
  resolvedAppId = appId || DEFAULT_ONESIGNAL_APP_ID;

  if (!resolvedAppId) {
    console.warn("OneSignal: No app ID provided — skipping init.");
    return;
  }

  try {
    await loadSDK();

    // Push init onto the deferred queue
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: resolvedAppId,
          serviceWorkerParam: { scope: "/" },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          allowLocalhostAsSecureOrigin: true,
        });
      } catch (e: any) {
        if (!e?.message?.includes("already")) {
          console.error("OneSignal init error:", e);
        }
      }
    });

    await new Promise((r) => setTimeout(r, 1000));
  } catch (e) {
    console.error("OneSignal initialization failed:", e);
  }
}

// Link device to Appwrite User ID

async function waitForOneSignal(timeoutMs = 5000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.OneSignal?.login) return window.OneSignal;
    await new Promise((r) => setTimeout(r, 200));
  }
  return window.OneSignal;
}

export async function loginOneSignal(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Ensure SDK is loaded
  await loadSDK();

  // Wait for OneSignal to be fully ready
  const OS = await waitForOneSignal();

  if (OS?.login) {
    try {
      await OS.login(userId);

      // optIn after login to create push subscription
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        await new Promise((r) => setTimeout(r, 500));
        if (OS.User?.PushSubscription) {
          await OS.User.PushSubscription.optIn();
        }
      }
    } catch (e) {
      console.error("OneSignal login failed:", e);
    }
    return;
  }

  // Fallback: push to deferred queue
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.login(userId);
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        OneSignal.User?.PushSubscription
      ) {
        await OneSignal.User.PushSubscription.optIn();
      }
    } catch (e) {
      console.error("OneSignal login failed:", e);
    }
  });
}

// Request notification permission (must be in click handler context)

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (window.OneSignal?.Notifications) {
      await window.OneSignal.Notifications.requestPermission();
      return window.OneSignal.Notifications.permission === true;
    }

    const result = await Notification.requestPermission();
    return result === "granted";
  } catch (e) {
    console.error("Permission request failed:", e);
    return false;
  }
}

// Check if notifications are enabled

export function isNotificationEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    return true;
  }
  try {
    return window.OneSignal?.Notifications?.permission === true;
  } catch {
    return false;
  }
}

// Legacy API surface (backward-compat with native)

export async function initializeNotifications(): Promise<string | null> {
  const granted = await requestNotificationPermission();
  return granted ? "onesignal" : null;
}

// PWA Detection Helpers

export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isWebPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): string {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

// Stubs for native API surface used by _layout.tsx

export function onNotificationTapped(_callback: (response: any) => void) {
  return { remove: () => {} };
}

export function onForegroundNotification(
  _callback: (notification: any) => void,
) {
  return { remove: () => {} };
}
