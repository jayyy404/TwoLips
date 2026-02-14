importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Pass through all fetch requests to avoid intercepting Appwrite uploads
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
