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

/** Tracks whether init() completed successfully */
let initCompleted = false;

/** Resolves once OneSignal.init() has completed */
let initResolve: (() => void) | null = null;
const initPromise = new Promise<void>((r) => {
  initResolve = r;
});

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
    console.warn("[OneSignal] No app ID provided — skipping init.");
    return;
  }

  console.log(
    "[OneSignal] Starting initialization with appId:",
    resolvedAppId.substring(0, 8) + "...",
  );

  try {
    await loadSDK();
    console.log("[OneSignal] SDK script loaded successfully");

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
        initCompleted = true;
        console.log("[OneSignal] init() completed successfully");

        // Log current permission & subscription state for debugging
        try {
          const permission = OneSignal.Notifications?.permission;
          const subId = OneSignal.User?.PushSubscription?.id;
          console.log(
            "[OneSignal] Permission:",
            permission,
            "| Subscription ID:",
            subId || "none",
          );
        } catch (_) {
          /* ignore */
        }
      } catch (e: any) {
        if (e?.message?.includes("already")) {
          initCompleted = true;
          console.log("[OneSignal] Already initialized (OK)");
        } else {
          console.error("[OneSignal] init error:", e);
        }
      } finally {
        // Signal that init is done (even if it threw "already initialized")
        initResolve?.();
      }
    });

    // Wait up to 5s for init to actually complete
    await Promise.race([initPromise, new Promise((r) => setTimeout(r, 5000))]);

    if (!initCompleted) {
      console.warn(
        "[OneSignal] init() did not complete within 5s — may still be loading",
      );
    }
  } catch (e) {
    console.error("[OneSignal] Initialization failed:", e);
  }
}

// Link device to Appwrite User ID

export async function loginOneSignal(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  console.log("[OneSignal] loginOneSignal called for user:", userId);

  // Wait until init() has actually completed — not just until the SDK script
  // is loaded.  Calling login() before init finishes causes an internal
  // "_i is undefined" crash inside the OneSignal v16 LoginManager.
  try {
    await Promise.race([
      initPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OneSignal init timed out")), 15000),
      ),
    ]);
  } catch (e) {
    console.warn(
      "[OneSignal] init did not complete in time, attempting login anyway",
      e,
    );
  }

  // Retry up to 3 times — SDK may still be initializing internally
  for (let attempt = 1; attempt <= 3; attempt++) {
    const OS = window.OneSignal;

    if (!OS?.login) {
      console.warn(
        `[OneSignal] SDK not ready (attempt ${attempt}/3), waiting 2s...`,
      );
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    try {
      await OS.login(userId);
      console.log("[OneSignal] login() succeeded for:", userId);

      // optIn after login to create push subscription
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        await new Promise((r) => setTimeout(r, 500));
        if (OS.User?.PushSubscription) {
          await OS.User.PushSubscription.optIn();
          console.log("[OneSignal] PushSubscription.optIn() called");
        }
      }

      // Log subscription state after login
      try {
        const subId = OS.User?.PushSubscription?.id;
        const token = OS.User?.PushSubscription?.token;
        console.log(
          "[OneSignal] After login — Sub ID:",
          subId || "none",
          "| Token:",
          token ? "present" : "none",
        );
      } catch (_) {
        /* ignore */
      }

      return;
    } catch (e: any) {
      console.error(`[OneSignal] login failed (attempt ${attempt}/3):`, e);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error("[OneSignal] login failed after 3 attempts for user:", userId);
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
