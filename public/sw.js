importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Only intercept fetch requests to Appwrite endpoints to avoid the service
// worker caching/blocking uploads.  Let OneSignal handle its own requests.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only pass through Appwrite API requests
  if (
    url.hostname.includes("appwrite") ||
    url.hostname.includes("cloud.appwrite.io")
  ) {
    event.respondWith(fetch(event.request));
  }
  // For everything else (including OneSignal), do nothing — let the
  // default handler or OneSignal SW handle it.
});
