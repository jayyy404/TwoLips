importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Only intercept Appwrite API fetch requests — let OneSignal handle its own.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("appwrite") ||
    url.hostname.includes("cloud.appwrite.io")
  ) {
    event.respondWith(fetch(event.request));
  }
});
